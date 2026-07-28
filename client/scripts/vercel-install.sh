#!/usr/bin/env bash
set -euo pipefail

# Vercel install hook for the client.
#
# Order matters: client/package.json has file-deps like "../wasm/anchor-cli/pkg"
# which don't exist until wasm-pack runs, so we must compile wasm BEFORE yarn install.

export CARGO_HOME="$PWD/node_modules/.cache/cargo"
export RUSTUP_HOME="$PWD/node_modules/.cache/rustup"
export CARGO_TARGET_DIR="$PWD/node_modules/.cache/cargo-target"
mkdir -p "$CARGO_HOME" "$RUSTUP_HOME" "$CARGO_TARGET_DIR"
export PATH="$CARGO_HOME/bin:$PATH"

# Matches wasm/build.sh's parsing of the same file.
RUST_VERSION=$(awk '/channel/{gsub(/"/, ""); print $3 }' ../wasm/rust-toolchain.toml)

# Cache diagnostic — if Vercel's build cache restored node_modules/.cache, cargo
# (and the toolchain it points at) should already be on disk.
if [ -x "$CARGO_HOME/bin/cargo" ]; then
  echo ">>> Build cache HIT: cargo present at $CARGO_HOME/bin/cargo"
  du -sh "$CARGO_HOME" "$RUSTUP_HOME" "$CARGO_TARGET_DIR" 2>/dev/null || true
else
  echo ">>> Build cache MISS: no cached cargo, installing rustup from scratch"
fi

if ! command -v cargo >/dev/null 2>&1; then
  # Version comes from wasm/rust-toolchain.toml so the initial `cargo install wasm-pack`
  # has a working toolchain before per-package rust-toolchain.toml files apply.
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --default-toolchain "$RUST_VERSION" --profile minimal --target wasm32-unknown-unknown
fi
rustup default "$RUST_VERSION"

bash ../wasm/build.sh

yarn install --frozen-lockfile
