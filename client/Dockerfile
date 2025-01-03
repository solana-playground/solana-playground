FROM node:22

WORKDIR /home/pg
COPY . .
COPY --from=solana-playground-wasm /wasm wasm

# Initialize submodules
RUN git submodule update --init

# Install dependencies
WORKDIR /home/pg/client
RUN yarn

# Start client
EXPOSE 3000
CMD ["yarn", "start"]
