FROM rust:1.75

WORKDIR /wasm

# Install a specific version of `wasm-pack` with no default features. See:
# - https://github.com/RReverser/wasm-bindgen-rayon/issues/9
# - https://github.com/rustwasm/wasm-pack/issues/1186#issuecomment-1374814605
RUN cargo install wasm-pack@0.10.3 --locked --no-default-features

# Build packages
COPY . .
RUN ./build.sh
