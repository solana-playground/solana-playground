use std::{
    fmt, mem,
    net::Ipv4Addr,
    path::{Path, PathBuf},
    process::Output,
    sync::OnceLock,
};

use anyhow::{anyhow, Result};
use tokio::{
    process::Command,
    spawn,
    sync::mpsc,
    task::JoinSet,
    time::{sleep, timeout, Duration},
    try_join,
};
use uuid::Uuid;

use crate::{
    command::AsyncCommand,
    log::{debug, enabled_debug, warn},
    utils::dedent,
};

/// Sandbox manager.
///
/// # Security
///
/// The implementation is based on Docker containers. It is intended to run processes as quickly as
/// possible with *relatively* safe defaults.
///
/// However, do note that while Docker containers are fast, they achieve this by sharing a decent
/// amount of the base functionality with the host, meaning they do not provide VM-level sandboxing.
///
/// It is recommended to use Rootless Docker to reduce the attack surface.
#[derive(Debug, Default)]
pub struct Sandbox<'a> {
    /// Configuration
    cfg: Config,
    /// Actions to run sequentially
    actions: Vec<Action<'a>>,
}

impl<'a> Sandbox<'a> {
    /// Sandbox resource name prefix
    const NAME_PREFIX: &'static str = concat!(env!("CARGO_PKG_NAME"), "-sandbox");

    /// Create a new [`Sandbox`] instance.
    ///
    /// # Note
    ///
    /// It's recommended to set [`Self::timeout_limit`] when the process can be cancelled
    /// externally. Not doing so may leave orphan containers.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the Docker image.
    ///
    /// Only Linux images are supported.
    #[must_use]
    pub fn image(mut self, image: impl ToString) -> Self {
        self.cfg.image.replace(image.to_string());
        self
    }

    /// Set the Docker image user (inside the container).
    // TODO: Make it default to what the image sets `USER` to (Docker defaults to `root`).
    #[must_use]
    pub fn user(mut self, user: impl ToString) -> Self {
        self.cfg.user.replace(user.to_string());
        self
    }

    /// Enable the proxy network mode.
    ///
    /// This mode restricts public network access to everywhere except `allowed_domains`. Only
    /// requests to TCP port 443 (HTTPS) is allowed.
    ///
    /// Allowed domains are converted to lowercase and request URLs are not case-sensitive.
    ///
    /// Subdomains are not allowed by default. To also allow subdomains, add the `.` prefix.
    ///
    /// # Note
    ///
    /// [`Self::build_proxy_image`] must be called beforehand.
    #[must_use]
    pub fn proxy<I, S>(mut self, allowed_domains: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: ToString,
    {
        self.cfg.network = Network::Proxy {
            allowed_domains: allowed_domains
                .into_iter()
                .map(|s| s.to_string())
                .map(|s| s.to_ascii_lowercase())
                .collect(),
        };
        self
    }

    /// Set the limits for the overall process.
    #[must_use]
    pub fn limits(mut self, limits: Limits) -> Self {
        self.cfg.limits = limits;
        self
    }

    /// Set the timeout limit for the overall process.
    #[must_use]
    pub fn timeout_limit(mut self, timeout_limit: u64) -> Self {
        self.cfg.limits.timeout.replace(timeout_limit);
        self
    }

    /// Set the CPU (cores) limit.
    #[must_use]
    pub fn cpu_limit(mut self, cpu_limit: usize) -> Self {
        self.cfg.limits.cpu.replace(cpu_limit);
        self
    }

    /// Set the memory limit.
    #[must_use]
    pub fn memory_limit(mut self, memory_limit: usize) -> Self {
        self.cfg.limits.memory.replace(memory_limit);
        self
    }

    /// Set the swap limit.
    ///
    /// This configuration only applies if there is a [`Self::memory_limit`].
    ///
    /// Unlike Docker:
    ///
    /// - Swap is disabled by default.
    /// - This is the exact swap value, not additional.
    #[must_use]
    pub fn swap_limit(mut self, swap_limit: usize) -> Self {
        self.cfg.limits.swap.replace(swap_limit);
        self
    }

    /// Set the process (PIDs) limit.
    #[must_use]
    pub fn process_limit(mut self, process_limit: usize) -> Self {
        self.cfg.limits.process.replace(process_limit);
        self
    }

    /// Set the storage limit.
    ///
    /// # Note
    ///
    /// This only works with the `overlay2` storage driver using `xfs` mounted with the `pquota`
    /// option. Otherwise it may error:
    ///
    /// ```txt
    /// docker: Error response from daemon: --storage-opt is supported only for overlay over xfs with 'pquota' mount option
    /// ```
    ///
    /// Docker documentation mentions that `btrfs` and `zfs` storage drivers are also supported, but
    /// they have additional limitations that make it infeasible to work with.
    ///
    /// `extfs` is still not supported: <https://github.com/moby/moby/issues/29364>
    #[must_use]
    pub fn storage_limit(mut self, storage_limit: usize) -> Self {
        self.cfg.limits.storage.replace(storage_limit);
        self
    }

    /// Command to run in a sandboxed environment.
    #[must_use]
    pub fn command(mut self, cmd: &'a Command) -> Self {
        self.actions.push(Action::Run(cmd));
        self
    }

    /// Copy the files from or to the container.
    ///
    /// Unlike Docker, relative paths default to the one set by the image `WORKDIR`.
    ///
    /// # Arguments
    ///
    /// Regular paths with container being special-cased as: `container:<path>`.
    #[must_use]
    pub fn copy<P1, P2>(mut self, src: P1, dst: P2) -> Self
    where
        P1: AsRef<Path>,
        P2: AsRef<Path>,
    {
        self.actions.push(Action::Copy(
            src.as_ref().to_path_buf(),
            dst.as_ref().to_path_buf(),
        ));
        self
    }

    /// Start the sandboxed process.
    pub async fn run(self) -> Result<Output> {
        let fut = async {
            let mut cleanup_guard = CleanupGuard::new();

            let uuid = Uuid::new_v4();
            let container = format!("{}-{uuid}", Self::NAME_PREFIX);

            let mut cmd = Command::new("docker");
            cmd.arg("run")
                .arg("--name")
                .arg(&container)
                .arg("--detach")
                .arg("--rm")
                .arg("--cap-drop=ALL")
                .arg("--oom-score-adj=1000") // Make the container easily killable when OOM
                .arg("--security-opt=no-new-privileges");

            if let Some(cpu) = self.cfg.limits.cpu {
                cmd.arg("--cpus").arg(cpu.to_string());
            }
            if let Some(mem) = self.cfg.limits.memory {
                let mem_arg = format!("{mem}b");
                cmd.arg("--memory").arg(&mem_arg);

                // Docker uses swap as an additional value; if `--memory` and `--memory-swap` are
                // equal, there is no swap
                cmd.arg("--memory-swap");
                match self.cfg.limits.swap {
                    // Configured `swap` value is the actual value (without `mem`). Add the values
                    // to account for what Docker expects.
                    Some(swap) => cmd.arg(format!("{}b", mem + swap)),
                    // Docker does not limit swap by default (host OS dependent). Set it to the same
                    // value as the memory argument to disable swap.
                    _ => cmd.arg(mem_arg),
                };
            }
            if let Some(pids) = self.cfg.limits.process {
                cmd.arg("--pids-limit").arg(pids.to_string());
            }
            if let Some(storage) = self.cfg.limits.storage {
                cmd.arg("--storage-opt").arg(format!("size={storage}b"));
            }

            let network = match self.cfg.network {
                Network::None => "none".to_owned(),
                Network::Proxy { allowed_domains } => {
                    // Both container and network name
                    let proxy_resource = format!("{}-proxy-{uuid}", Self::NAME_PREFIX);

                    // 1 address for the proxy container and 3 to Docker (internal)
                    const BUMP: u32 = 1 + 3;
                    const CIDR_MAX: u8 = 32;
                    let cidr = CIDR_MAX - (BUMP as f64).log2().ceil() as u8;
                    let subnet_addr = Self::get_resources(Resource::network())
                        .await?
                        .into_iter()
                        .map(|network| async move {
                            Command::new("docker")
                                .arg("network")
                                .arg("inspect")
                                .arg(network.name())
                                .arg("--format")
                                .arg("{{range .IPAM.Config}}{{.Subnet}}{{end}}")
                                .output_stdout()
                                .await
                        })
                        .collect::<JoinSet<_>>()
                        .join_all()
                        .await
                        .into_iter()
                        .collect::<Result<Vec<_>>>()?
                        .into_iter()
                        .map(|subnet| match subnet.split_once('/') {
                            Some((addr, _)) => addr.parse::<Ipv4Addr>().map_err(Into::into),
                            _ => Err(anyhow!("Invalid subnet: {subnet}")),
                        })
                        .collect::<Result<Vec<_>>>()?
                        .into_iter()
                        .max()
                        .and_then(|addr| addr.to_bits().checked_add(BUMP).map(Ipv4Addr::from))
                        .unwrap_or_else(|| Ipv4Addr::new(172, 42, 0, 0));
                    let subnet = format!("{subnet_addr}/{cidr}");
                    let ip = subnet_addr
                        .to_bits()
                        // `subnet_addr + 1` is the default gateway; take the next
                        .checked_add(2)
                        .map(Ipv4Addr::from)
                        .ok_or_else(|| anyhow!("Failed to create ip from subnet: {subnet_addr}"))?
                        .to_string();

                    // TODO: Make the proxy port dynamic
                    // Create the proxy network
                    Command::new("docker")
                        .arg("network")
                        .arg("create")
                        .arg("--driver=bridge")
                        .arg("--subnet")
                        .arg(&subnet)
                        .arg(&proxy_resource)
                        .run()
                        .await?;
                    cleanup_guard.network(&proxy_resource);

                    // Convert allowed domains to a `bash` array values
                    let allowed_domains = allowed_domains.into_iter().fold(
                        String::new(),
                        |mut acc, allowed_domain| {
                            acc.push('"');
                            acc.push_str(&allowed_domain);
                            acc.push('"');
                            acc.push(' ');
                            acc
                        },
                    );

                    // Quotas
                    let download_quota = self.cfg.limits.download.unwrap_or(usize::MAX);
                    let upload_quota = self.cfg.limits.upload.unwrap_or(usize::MAX);

                    // Create and start the proxy container
                    Command::new("docker")
                        .arg("run")
                        .arg("--rm")
                        .arg("--detach")
                        .arg("--name")
                        .arg(&proxy_resource)
                        .arg("--network")
                        .arg(&proxy_resource)
                        .arg("--ip")
                        .arg(ip)
                        .arg("--health-cmd")
                        // Check whether:
                        //
                        // - the proxy TCP port has been binded
                        // - only the required capabilities remain
                        .arg(dedent(
                            r#"
                            grep -q ':0C38' /proc/net/tcp && awk '
                            $1=="Uid:"     && $2=="13" && $3=="13" && $4=="0"  && $5=="13" { uid=1 }
                            $1=="Gid:"     && $2=="13" && $3=="13" && $4=="13" && $5=="13" { gid=1 }
                            $1=="CapInh:"  && $2=="0000000000000000" { inh=1 }
                            $1=="CapPrm:"  && $2=="00000000000000c0" { prm=1 }
                            $1=="CapEff:"  && $2=="0000000000000000" { eff=1 }
                            $1=="CapBnd:"  && $2=="00000000000000c0" { bnd=1 }
                            $1=="CapAmb:"  && $2=="0000000000000000" { amb=1 }
                            END { exit !(uid && gid && inh && prm && eff && bnd && amb) }
                            ' /proc/1/status
                            "#
                        ))
                        .arg("--health-interval=100ms")
                        .arg("--health-timeout=100ms")
                        .arg("--health-retries=10")
                        .arg("--cap-drop=ALL")
                         // Allow `ipconfig` changes
                        .arg("--cap-add=CAP_NET_ADMIN")
                        // Next 2 allow changing the user (`squid` does internally)
                        .arg("--cap-add=SETUID")
                        .arg("--cap-add=SETGID")
                        // // Important: allow setting capabilities (to remove later)
                        .arg("--cap-add=SETPCAP")
                        .arg("--entrypoint=/bin/sh")
                        .arg(Self::proxy_image_name())
                        .arg("-c")
                        .arg(dedent(format!(
                            r#"
                            # Set sane flags
                            set -eu

                            # Drop all traffic by default
                            iptables -F
                            iptables -X
                            iptables -P INPUT DROP
                            iptables -P OUTPUT DROP
                            iptables -P FORWARD DROP

                            # Allow DNS queries to Docker
                            # Do not add `--dport 53` because Docker rewrites it to dynamic ports
                            iptables -A OUTPUT -d 127.0.0.11 -p udp -j ACCEPT
                            iptables -A OUTPUT -d 127.0.0.11 -p tcp -j ACCEPT

                            # Allow loopback (for proxy and DNS)
                            iptables -A INPUT -i lo -d 127.0.0.1/8 -p udp -j ACCEPT
                            iptables -A INPUT -i lo -d 127.0.0.1/8 -p tcp -j ACCEPT
                            iptables -A OUTPUT -o lo -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

                            # Allow replies from the proxy
                            iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

                            # Do not redirect the proxy's own outbound HTTPS connections
                            iptables -t nat -A OUTPUT -p tcp --dport 443 -m owner --uid-owner 13 -j RETURN

                            # Redirect the main container HTTPS to the proxy
                            iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-ports 3128

                            # Permit output to the proxy
                            iptables -A OUTPUT -d 127.0.0.1 -p tcp -m owner ! --uid-owner 13 --dport 3128 -j ACCEPT

                            # Permit the proxy itself to connect to origin HTTPS servers
                            iptables -A OUTPUT -p tcp -m owner --uid-owner 13 --dport 443 -j ACCEPT

                            # Disable IPv6 except loopback
                            ip6tables -F
                            ip6tables -X
                            ip6tables -P INPUT DROP
                            ip6tables -P OUTPUT DROP
                            ip6tables -P FORWARD DROP
                            # Loopback is required for `external_acl_type sni_dst` to work
                            ip6tables -A INPUT -i lo -s ::1/128 -d ::1/128 -p tcp -j ACCEPT
                            ip6tables -A INPUT  -i lo -s ::1/128 -d ::1/128 -p udp -j ACCEPT
                            ip6tables -A OUTPUT -o lo -s ::1/128 -d ::1/128 -p tcp -j ACCEPT
                            ip6tables -A OUTPUT -o lo -s ::1/128 -d ::1/128 -p udp -j ACCEPT

                            # Add quotas
                            nft -f - <<'QUOTAS'
                            table inet proxy_quota {{
                                quota download {{ over {download_quota} bytes; }}
                                quota upload {{ over {upload_quota} bytes; }}
                                define DOWNLOAD_MARK = 0x444f574e # ASCII "DOWN"

                                chain mark_https_connections {{
                                    type filter hook output priority mangle; policy accept;
                                    meta skuid 13 tcp dport 443 ct mark set $DOWNLOAD_MARK
                                }}

                                chain download_limit {{
                                    type filter hook input priority -1; policy accept;
                                    ct mark $DOWNLOAD_MARK tcp sport 443 quota name "download" drop
                                }}

                                chain upload_limit {{
                                    type filter hook output priority -1; policy accept;
                                    meta skuid 13 tcp dport 443 quota name "upload" drop
                                }}
                            }}
                            QUOTAS

                            # TODO: Make it work without custom certificates
                            openssl req \
                                -new \
                                -newkey rsa:2048 \
                                -nodes \
                                -x509 \
                                -days 3650 \
                                -subj "/CN=Playground Interception Service" \
                                -addext "basicConstraints=critical,CA:TRUE,pathlen:1" \
                                -addext "keyUsage=critical,keyCertSign,cRLSign" \
                                -addext "subjectKeyIdentifier=hash" \
                                -keyout /etc/squid/interception.pem \
                                -out /etc/squid/interception.crt \
                                > /dev/null 2>&1

                            # Create SNI and DST comparison check for `squid`
                            cat >/etc/squid/check-sni-dst-acl.sh <<'SH'
                            #!/usr/bin/env bash

                            exec 2>>/tmp/sni-acl-debug.log

                            ALLOWED_DOMAINS=({allowed_domains})

                            is_approved_domain() {{
                                local sni=$1
                                local domain

                                for domain in "${{ALLOWED_DOMAINS[@]}}"; do
                                    domain=${{domain#.}}
                                    domain=${{domain,,}}
                                    domain=${{domain%.}}
                                    if [[ "$sni" == "$domain" ]]; then
                                        return 0
                                    fi
                                done

                                return 1
                            }}

                            destination_matches_sni() {{
                                local sni=$1
                                local dst=$2
                                local dns_output
                                local resolved_ip

                                dns_output=$(mktemp /tmp/sni-dns) || return 2

                                if ! getent ahostsv4 "$sni" >"$dns_output"; then
                                    rm -f "$dns_output"
                                    return 2
                                fi

                                while read -r resolved_ip _; do
                                    if [[ "$resolved_ip" == "$dst" ]]; then
                                        rm -f "$dns_output"
                                        return 0
                                    fi
                                done <"$dns_output"

                                rm -f "$dns_output"
                                return 1
                            }}

                            while IFS=' ' read -r sni dst rest; do
                                sni=${{sni,,}}
                                sni=${{sni%.}}

                                if [[ -z "$sni" || -z "$dst" ]]; then
                                    printf '%s\n' ERR
                                    continue
                                fi

                                if [[ ! "$sni" =~ ^[a-z0-9.-]+$ ]]; then
                                    printf '%s\n' ERR
                                    continue
                                fi

                                if [[ ! "$dst" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                                    printf '%s\n' ERR
                                    continue
                                fi

                                if ! is_approved_domain "$sni"; then
                                    printf '%s\n' ERR
                                    continue
                                fi

                                destination_matches_sni "$sni" "$dst"
                                result=$?

                                case "$result" in
                                    0) printf '%s\n' OK ;;
                                    1) printf '%s\n' ERR ;;
                                    *) printf '%s\n' BH ;;
                                esac
                            done
                            SH

                            chmod 755 /etc/squid/check-sni-dst-acl.sh

                            # Create `squid` configuration
                            cat >/etc/squid/squid.conf <<\CONF

                            # ICMP pinger logs redundant errors
                            pinger_enable off

                            # Unused but required
                            http_port 127.0.0.0:3127

                            # Intercept HTTPS traffic
                            https_port 127.0.0.1:3128 intercept ssl-bump \
                                # The following 2 are unused but required
                                tls-cert=/etc/squid/interception.crt \
                                tls-key=/etc/squid/interception.pem \
                                generate-host-certificates=off

                            acl subnet src {subnet}

                            acl tls_step1 at_step SslBump1
                            acl tls_step2 at_step SslBump2

                            # TODO: Provide options to be more intentional
                            # TODO: Add tests
                            external_acl_type sni_dst \
                                # Next 2 disable caching
                                ttl=0 \
                                negative_ttl=0 \
                                %ssl::>sni %DST \
                                /etc/squid/check-sni-dst-acl.sh

                            acl sni_destination_ok external sni_dst

                            # Require allowed SNIs and DST during TLS
                            ssl_bump peek tls_step1
                            ssl_bump splice tls_step2 sni_destination_ok
                            ssl_bump terminate tls_step2

                            http_access allow subnet
                            http_access deny all

                            cache deny all
                            # access_log none
                            # cache_log none
                            access_log stdio:/var/log/squid/access.log
                            cache_log stdio:/var/log/squid/cache.log
                            CONF

                            # Drop capabilities
                            exec setpriv \
                                --no-new-privs \
                                --bounding-set=-net_admin,-setpcap \
                                squid -N -f /etc/squid/squid.conf
                            "#
                        )))
                        .run()
                        .await?;
                    cleanup_guard.container(&proxy_resource);

                    // Wait until the proxy container is ready (networking doesn't work otherwise)
                    wait_until_healthy(&proxy_resource).await?;

                    format!("container:{proxy_resource}")
                }
            };

            let Some(user) = &self.cfg.user else {
                return Err(anyhow!("An unprivileged user is required"));
            };
            let Some(image) = &self.cfg.image else {
                return Err(anyhow!("Image is required"));
            };

            let sleep_timeout = match self.cfg.limits.timeout {
                Some(timeout) => format!("sleep {timeout}"),
                _ => "sleep infinity".to_owned(),
            };

            // Create and start the main container
            cmd.arg("--network")
                .arg(network)
                .arg("--user")
                .arg(user)
                .arg(image)
                .arg("sh")
                .arg("-c")
                .arg(sleep_timeout)
                .run()
                .await?;
            cleanup_guard.container(&container);

            let mut all_output = Output {
                status: Default::default(),
                stderr: Default::default(),
                stdout: Default::default(),
            };
            for action in &self.actions {
                match action {
                    Action::Copy(src, dst) => {
                        // `docker cp` does not respect current workdir and assumes relative paths
                        // to be relative to `/`. As a workaround, get the current dir from the
                        // running container and make the path absolute.
                        //
                        // TODO: Only run when there is a relative container path
                        let workdir = Command::new("docker")
                            .arg("exec")
                            .arg("--user")
                            .arg(user)
                            .arg(&container)
                            .arg("pwd")
                            .output_stdout()
                            .await
                            .map(PathBuf::from)?;

                        let src = Action::copy_path(src, &container, &workdir)?;
                        let stripped_container_dst = dst
                            .to_str()
                            .ok_or_else(|| anyhow!("Invalid path: {dst:?}"))?
                            .strip_prefix("container:")
                            .map(Path::new);
                        match stripped_container_dst {
                            // If transfering to the container, `docker cp` does not set the current
                            // user as the owner. The owner cannot be changed because `CAP_CHOWN` is
                            // removed (by `--cap-drop=ALL`). As a workaround, `docker cp` into a
                            // temp directory and then copy the files to the actual destination
                            // using the current user.
                            Some(stripped_container_dst) => {
                                // TODO: Get temp dir from the container instead of hardcoding
                                let temp_dst = Path::new("/tmp").join(stripped_container_dst);
                                let dst = Action::copy_path(
                                    &PathBuf::from(format!("container:{}", temp_dst.display())),
                                    &container,
                                    &workdir,
                                )?;
                                Command::new("docker")
                                    .arg("cp")
                                    .arg(src)
                                    .arg(dst)
                                    .run()
                                    .await?;
                                Command::new("docker")
                                    .arg("exec")
                                    .arg("--user")
                                    .arg(user)
                                    .arg(&container)
                                    .arg("cp")
                                    .arg("--recursive")
                                    .arg(temp_dst.join("."))
                                    .arg(stripped_container_dst)
                                    .run()
                                    .await?;
                            }
                            _ => {
                                let dst = Action::copy_path(dst, &container, &workdir)?;
                                Command::new("docker")
                                    .arg("cp")
                                    .arg(src)
                                    .arg(dst)
                                    .run()
                                    .await?;
                            }
                        }
                    }
                    Action::Run(cmd) => {
                        let cmd = cmd.as_std();
                        let output = Command::new("docker")
                            .arg("exec")
                            .arg("--user")
                            .arg(user)
                            .arg(&container)
                            .arg(cmd.get_program())
                            .args(cmd.get_args())
                            .env_clear()
                            .envs(cmd.get_envs().filter_map(|(k, v)| v.map(|v| (k, v))))
                            .output()
                            .await?;
                        all_output.status = output.status;
                        all_output.stderr.extend_from_slice(&output.stderr);
                        all_output.stdout.extend_from_slice(&output.stdout);
                        if !all_output.status.success() {
                            break;
                        }
                    }
                }
            }

            Ok(all_output)
        };

        // Wait for completion
        match self.cfg.limits.timeout {
            Some(to) => match timeout(Duration::from_secs(to), fut).await {
                Ok(res) => res,
                Err(_) => Err(anyhow!("Timed out")),
            },
            _ => fut.await,
        }
    }

    /// Get sandboxed image name.
    pub fn get_image_name(name: impl fmt::Display) -> String {
        format!("{}-{name}", Self::NAME_PREFIX)
    }

    /// Get the proxy image name.
    fn proxy_image_name() -> String {
        Self::get_image_name("proxy")
    }

    /// Build the proxy image.
    pub async fn build_proxy_image() -> Result<()> {
        Command::new("docker")
            .arg("build")
            .arg("--tag")
            .arg(Self::proxy_image_name())
            .arg("-")
            .input(
                dedent(
                    r#"
                    # `ubuntu/squid` image doesn't work because it's compiled without `openssl` support
                    FROM ubuntu:24.04@sha256:80dd3c3b9c6cecb9f1667e9290b3bc61b78c2678c02cbdae5f0fea92cc6734ab

                    RUN apt-get update && apt-get install -y \
                        iptables=1.8.10-3ubuntu2 \
                        squid-openssl=6.14-0ubuntu0.24.04.4

                    ENTRYPOINT ["squid"]
                    "#,
                )
                .as_bytes(),
            )
            .await
    }

    /// Remove all resources created by the sandbox process.
    ///
    /// Images are excluded.
    pub async fn cleanup() -> Result<()> {
        let (containers, networks) = try_join!(
            Self::get_resources(Resource::container()),
            Self::get_resources(Resource::network())
        )?;

        let cleanup = async |resources: Vec<Resource>| {
            resources
                .into_iter()
                .map(|resource| async { resource.cleanup().await })
                .collect::<JoinSet<_>>()
                .join_all()
                .await
                .into_iter()
                .collect::<Result<Vec<_>>>()
        };

        // Important: containers must be cleaned up before networks
        cleanup(containers).await?;
        cleanup(networks).await?;

        Ok(())
    }

    /// Get all resources for the given resource type.
    ///
    /// It may seem strange that this takes a [`Resource`]. This is done to avoid duplicating it
    /// with an enum that is almost identical.
    async fn get_resources(resource: Resource) -> Result<Vec<Resource>> {
        let mut cmd = Command::new("docker");
        match resource {
            Resource::Container(_) => cmd
                .arg("container")
                .arg("ls")
                .arg("--all")
                .arg("--format")
                .arg("{{.Names}}"),
            Resource::Network(_) => cmd
                .arg("network")
                .arg("ls")
                .arg("--format")
                .arg("{{.Name}}"),
        };
        Ok(cmd
            .output_stdout()
            .await?
            .lines()
            .filter(|name| name.starts_with(Self::NAME_PREFIX))
            .map(ToOwned::to_owned)
            .map(|name| match resource {
                Resource::Container(_) => Resource::Container(name),
                Resource::Network(_) => Resource::Network(name),
            })
            .collect())
    }
}

/// Sandbox configuration
#[derive(Debug, Default)]
struct Config {
    /// Image name
    image: Option<String>,
    /// Image user (unprivileged; no `root` or `sudo`)
    user: Option<String>,
    /// Container network
    network: Network,
    /// Container limits
    limits: Limits,
}

/// Sandbox network
#[derive(Debug, Default)]
enum Network {
    /// No networking in the container (default, unlike Docker)
    #[default]
    None,
    // TODO: Custom DNS
    /// Proxy connection using a custom network
    Proxy { allowed_domains: Vec<String> },
}

/// Sandbox limits
#[derive(Copy, Clone, Debug, Default)]
pub struct Limits {
    /// Timeout limit
    pub timeout: Option<u64>,
    /// CPU (cores) limit
    pub cpu: Option<usize>,
    /// Memory limit (in bytes)
    pub memory: Option<usize>,
    /// Swap limit (in bytes)
    pub swap: Option<usize>,
    /// Process (PIDs) limit
    pub process: Option<usize>,
    /// Storage limit
    pub storage: Option<usize>,
    /// Proxy network download limit (total quota in bytes)
    pub download: Option<usize>,
    /// Proxy network upload limit (total quota in bytes)
    pub upload: Option<usize>,
}

/// Sandbox action
#[derive(Debug)]
enum Action<'a> {
    /// Run a command
    Run(&'a Command),
    /// Copy from or to the container
    Copy(PathBuf, PathBuf),
}

impl Action<'_> {
    /// Convert custom `container:*` syntax to the one Docker expects with relative path support.
    fn copy_path(path: &Path, container: &str, workdir: &Path) -> Result<PathBuf> {
        // TODO: Something more idiomatic
        path.to_str()
            .ok_or_else(|| anyhow!("Invalid path: {path:?}"))
            .map(|p| {
                if p.starts_with("container:/") {
                    p.replacen("container", container, 1)
                } else if p.starts_with("container:") {
                    p.replacen(
                        "container:",
                        &format!("{container}:{}/", workdir.display()),
                        1,
                    )
                } else {
                    p.to_owned()
                }
            })
            .map(PathBuf::from)
    }
}

/// A guard to cleanup sandbox resources.
///
/// Resources are cleaned in reverse order once the value is dropped.
#[derive(Debug, Default)]
struct CleanupGuard {
    /// Sandbox resources to clean
    resources: Vec<Resource>,
}

impl CleanupGuard {
    /// Create a new clean guard.
    fn new() -> Self {
        Self::default()
    }

    /// Add a container to be cleaned up later.
    fn container(&mut self, name: impl ToString) {
        self.resources.push(Resource::Container(name.to_string()))
    }

    /// Add a network to be cleaned up later.
    fn network(&mut self, name: impl ToString) {
        self.resources.push(Resource::Network(name.to_string()))
    }
}

impl Drop for CleanupGuard {
    fn drop(&mut self) {
        let resources = mem::take(&mut self.resources);
        if !resources.is_empty() {
            static SERVICE: OnceLock<mpsc::UnboundedSender<Vec<Resource>>> = OnceLock::new();
            let _ = SERVICE
                .get_or_init(|| {
                    let (tx, mut rx) = mpsc::unbounded_channel::<Vec<Resource>>();
                    spawn(async move {
                        while let Some(mut resources) = rx.recv().await {
                            while let Some(resource) = resources.pop() {
                                if let Err(e) = resource.cleanup().await {
                                    warn!("Sandbox cleanup failed: {e}")
                                }
                            }
                        }
                    });

                    tx
                })
                .send(resources);
        }
    }
}

/// Sandbox resource type
#[derive(Debug)]
enum Resource {
    /// Docker container
    Container(String),
    /// Docker network
    Network(String),
}

impl Resource {
    /// A value to indicate container resources.
    fn container() -> Self {
        Self::Container(String::default())
    }

    /// A value to indicate network resources.
    fn network() -> Self {
        Self::Network(String::default())
    }

    /// Name of the resource.
    fn name(&self) -> &str {
        match self {
            Self::Container(name) => name,
            Self::Network(name) => name,
        }
    }

    /// Cleanup the resource.
    async fn cleanup(self) -> Result<()> {
        debug!("Cleaning up: {:?}", self);
        match self {
            Self::Container(name) => {
                Command::new("docker")
                    .arg("rm")
                    // `--force` to make it not error if the container does not exist
                    .arg("--force")
                    .arg(name)
                    .run()
                    .await
            }
            Self::Network(name) => {
                Command::new("docker")
                    .arg("network")
                    .arg("rm")
                    // `--force` to make it not error if the network does not exist
                    .arg("--force")
                    .arg(name)
                    .run()
                    .await
            }
        }
    }
}

/// Wait until the Docker resource is "healthy".
///
/// An error is returned if the container becomes "unhealthy".
///
/// This requires `--health-cmd` during container creation.
async fn wait_until_healthy(resource: &str) -> Result<()> {
    loop {
        let status = Command::new("docker")
            .arg("inspect")
            .arg("--format")
            .arg("{{.State.Health.Status}}")
            .arg(resource)
            .output_stdout()
            .await?;
        match status.as_str() {
            "healthy" => return Ok(()),
            "unhealthy" => {
                if enabled_debug!() {
                    let logs = Command::new("docker")
                        .arg("logs")
                        .arg("--timestamps")
                        .arg("--tail")
                        .arg("all")
                        .arg(resource)
                        .output_stdout()
                        .await?;
                    debug!(resource, logs);
                }

                return Err(anyhow!("Container became unhealthy"));
            }
            _ => sleep(Duration::from_millis(100)).await,
        }
    }
}
