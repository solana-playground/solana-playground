# Default non-root user
ARG USER

################# BASE RUST INSTALLATION TO USE IN OTHER STEPS #################
FROM ubuntu:24.04 AS rust

ARG USER
ARG DEBIAN_FRONTEND="noninteractive"

# Install build deps
RUN apt-get update -qq && apt-get upgrade -qq && apt-get install -qq \
    build-essential curl pkg-config libssl-dev libudev-dev

# Create a non-root user
RUN useradd -m -u 1001 -s /bin/bash ${USER}
USER ${USER}
ENV HOME="/home/${USER}"

# Install Rust
RUN sh -c "$(curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs)" -- -y
ENV PATH="${HOME}/.cargo/bin:${PATH}"

############################## BUILD SERVER BINARY #############################
FROM rust AS build

WORKDIR /build
COPY Cargo.* .
COPY src src
RUN cargo build --release

################################# START SERVER #################################
FROM rust

ARG USER
ARG SOLANA_VERSION="1.17.34"

# Install Solana
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v${SOLANA_VERSION}/install)"
ENV PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"

# Set the workdir
WORKDIR /home/${USER}

# Copy programs dir and build the default program
COPY --chown=${USER}:${USER} programs programs
RUN cargo-build-sbf --manifest-path programs/Cargo.toml

# Start server
COPY --from=build /build/target/release/solpg-server .
EXPOSE 8080
CMD ["./solpg-server"]
