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

# Deployment

The server is deployed to **Google App Engine** as the `playground-server` service via [`.github/workflows/cicd_server.yml`](../.github/workflows/cicd_server.yml). Pushes to `master` run `cargo fmt` + `cargo clippy`, then `gcloud app deploy server/app.yaml` from a checkout that includes git tags.

The deployed App Engine version is derived from the latest git tag (periods replaced with dashes — e.g. `0.29.1` → `0-29-1`) and is uploaded with `--no-promote`, so traffic must be cut over manually in the GCP console.

## Versioning

Tags are the unit of release. To cut a new deployable version:

1. Bump the relevant version (e.g. `git tag 0.29.2`).
2. Push the tag and merge the changes to `master`.
3. The workflow normalizes the tag and deploys it as a parked App Engine version.

## Required GitHub secrets

| Secret            | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `GCP_KEY`         | Service-account JSON for `google-github-actions/auth`. |
| `SERVICE_ACCOUNT` | Service-account email used by `gcloud config`.   |
| `PROJECT_ID`      | GCP project that owns the App Engine app.       |

Runtime configuration (database URI, API keys, etc.) is **not** baked into [`app.yaml`](app.yaml). Inject them via GCP Secret Manager or the App Engine env-var replace step in the workflow.
