# Server

Anything that can be done client-side should be done client-side.

Ideally this server shouldn't exist and everything should be done on clients but unfortunately it's not yet possible to build programs on browsers with the current tooling. This is more of a `rustc` issue and progress is being made in:

- https://github.com/rust-lang/miri/issues/722.
- https://github.com/bytecodealliance/wasmtime/issues/2566

## Setup

The easiest way to run the server is via [Docker Compose](https://github.com/docker/compose):

```sh
docker compose -f ../compose.yaml --profile dev up server --build
```

This will:

1. Create a [MongoDB](https://github.com/mongodb/mongo) database
2. Build the server from source
3. Start the server

See the [root README](../README.md#run-with-docker) for more options.

### Language server (unstable)

With `--features unstable`, `GET /unstable/lsp` bridges a WebSocket to a `rust-analyzer` running inside the template's program image, so the editor gets intellisense and `cargo check` diagnostics for the exact toolchain the build uses. The client enables it with the **Rust Analyzer: Server** setting.

Each session is one container for as long as the editor stays connected, so the limits are separate from builds:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PG_LSP_CONCURRENCY` | `4` | Maximum concurrent sessions |
| `PG_LSP_IDLE_TIMEOUT` | `600` | Seconds without a client message before a session is closed |
| `PG_LSP_MAX_LIFETIME` | `14400` | Seconds after which a session is closed regardless of activity |

`PG_PAYLOAD_LIMIT` also caps the project size a session accepts, and only origins listed in `PG_CLIENT_URLS` may open one (browsers do not apply CORS to WebSockets). Containers carry the `solpg.lsp` label; leftovers from a crashed server are killed on the next start.

# Deployment

The server is deployed to **Google App Engine** as the `playground-server` service via [`.github/workflows/cicd.yml`](../.github/workflows/cicd.yml). The workflow triggers on pushes to `master` and on manual dispatch, but checks and deploy run only for a tagged commit — untagged pushes exit early.

The App Engine version label is the tag with periods replaced by dashes (e.g. `1.2.3` → `1-2-3`) and is uploaded with `--no-promote`, so traffic must be cut over manually in the GCP console.

## Versioning

Tags are the unit of release. The deploy uses `git describe --exact-match`, so the tag must point to the commit at `master` HEAD. To cut a new version:

1. Tag the commit you're releasing (e.g. `git tag 1.2.3`).
2. Push the branch and tag together so the tagged commit is master's HEAD — e.g. `git push origin master --follow-tags`.
3. The workflow normalizes the tag and deploys it as a parked App Engine version.

Or run it manually (Actions → CICD → Run workflow) to deploy the latest tag.

## Required GitHub secrets

| Secret            | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `GCP_KEY`         | Service-account JSON for `google-github-actions/auth`. |
| `SERVICE_ACCOUNT` | Service-account email used by `gcloud config`.   |
| `PROJECT_ID`      | GCP project that owns the App Engine app.       |

Runtime configuration (e.g. the database URI) is **not** baked into [`app.yaml`](app.yaml); set it on the App Engine service separately. Note: the current deploy does not set `PG_DB_URI`, so the server's database connection is not configured by this workflow.
