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

## Overview

This project uses **Google App Engine** for deployments. Each deployed version is managed intentionally using:

- Branches for each major [Anchor](https://github.com/solana-foundation/anchor) dependency version
- Git tags for incremental sub-versions within each branch

## Branching Strategy

Each branch corresponds to a specific **Anchor dependency version** used by the project. For example, if your `Cargo.toml` contains:

```
anchor-syn = { version = "0.29.0" }
```

Then the branch should be named `v0.29`.


## Tagging Strategy

Within each version branch use **Git tags** to define deployable sub-versions. Tags should follow the pattern:

```
<anchor_major_minor>.<patch>
```

For example:

- First deployment from branch `v0.29` → tag: `0.29.1`
- Subsequent update → tag: `0.29.2`


## GitHub Actions Deployment Workflow

**Important:** The GitHub Actions deployment workflow (ci.yml and deploy.yaml) is configured to trigger on a **specific branch**. Every time a new major version branch is introduced, you will need to:

1. Create the new branch: `v0.30`.
2. Update the GitHub Actions deployment YAML to include this branch as a trigger. 

from:

```yaml
on:
  push:
    branches:
      - v0.29
```
to:
```yaml
on:
  push:
    branches:
      - v0.30
```

3. Commit and push the updated workflow file to the new branch
