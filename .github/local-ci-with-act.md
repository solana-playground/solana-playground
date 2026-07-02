# Running CI locally with `act`

See the [`act` docs](https://github.com/nektos/act) for installation and usage.
This covers only the project-specific setup.

Create `.actrc` in the repo root (local-only, not committed):

```ini
# Map ubuntu-latest to catthehacker's full Ubuntu 24.04 runner image (rustup/cargo/node pre-installed); multi-arch tag so Docker resolves to the platform act requests. `full-24.04` matches what GitHub's `ubuntu-latest` currently runs.
-P ubuntu-latest=catthehacker/ubuntu:full-24.04

# Redirect @actions/tool-cache writes to a user-writable dir; /opt/hostedtoolcache is root-owned, so setup-node fails with EACCES when installing an uncached node version.
--env RUNNER_TOOL_CACHE=/tmp/runner-tool-cache

# Force x86_64 on arm64 hosts (Apple Silicon); wasm-pack 0.10.3 ships no arm64 wasm-opt binary, so the build job aborts under linux/arm64.
--container-architecture linux/amd64
```

Run a workflow (`-W` scopes to one file, the event selects the trigger):

```bash
act pull_request -W .github/workflows/ci.yml          # PR checks
act workflow_dispatch -W .github/workflows/cicd.yml   # deploy pipeline
```

The `build` job's final `git status` check requires a clean tree — commit or
`git stash -u` your changes first.
