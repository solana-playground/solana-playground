# Conditionally copy based on whether the server image has been built before
ARG HAS_SERVER
# Default non-root user
ARG USER
# Base image
ARG IMAGE="node:22"

################################## Has server ##################################
FROM ${IMAGE} AS server-true

ARG USER

# Install Rust
ONBUILD RUN sh -c "$(curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs)" -- -y
ONBUILD ENV PATH="/root/.cargo/bin:$PATH"

# Copy the built crate infos from the server image
ONBUILD COPY --from=solana-playground-server /home/${USER}/.cargo /root/.cargo

################################### No server ##################################
FROM ${IMAGE} AS server-false

# Set build server URL to the production API
ONBUILD ENV REACT_APP_SERVER_URL="https://api.solpg.io"

###################### Build and start development client ######################
FROM server-${HAS_SERVER}

ARG USER

WORKDIR /home/${USER}
COPY . .

# The WASM image has to be built before, which is handled by the compose file
COPY --from=solana-playground-wasm /wasm wasm

# Initialize submodules
RUN git submodule update --init

# Install dependencies
WORKDIR /home/${USER}/client
RUN yarn

# Start client
EXPOSE 3000
CMD ["yarn", "start"]
