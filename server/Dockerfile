################# BASE RUST INSTALLATION TO USE IN OTHER STEPS #################
FROM ubuntu:22.04 as rust

ARG DEBIAN_FRONTEND="noninteractive"

ENV HOME="/root"

# Install build deps
RUN apt-get update -qq && apt-get upgrade -qq && apt-get install -qq \
    build-essential curl pkg-config libssl-dev libudev-dev

# Install rustup and the nightly toolchain (required to generate 0.30.0 IDL)
# docker buildx build --platform linux/amd64, throws Segmentation fault on Mac
# https://github.com/docker/for-mac/issues/7295
# RUN sh -c "$(curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs)" -- -y \
#     && rustup default nightly

# Install Rust
RUN sh -c "$(curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs)" -- -y \
    && rustup default nightly
ENV PATH="${HOME}/.cargo/bin:${PATH}"

############################## BUILD SERVER BINARY #############################
FROM rust as build

WORKDIR /build
COPY Cargo.* .
COPY src src
RUN cargo build --release

################################# START SERVER #################################
FROM rust

ARG SOLANA_VERSION="1.18.16"

# Install Solana
RUN sh -c "$(curl -sSfL https://release.solana.com/v${SOLANA_VERSION}/install)" \
ENV PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"


# Set the workdir
WORKDIR /home/pg

# Copy programs dir and build the default program
COPY programs programs
RUN cargo-build-sbf --manifest-path programs/Cargo.toml

# Start server
COPY --from=build /build/target/release/solpg-server .
EXPOSE 8080
CMD ["./solpg-server"]
