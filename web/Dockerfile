ARG IMAGE="node:22.20.0"

# Install Hono wrapper deps only (no client or wasm build here — the CRA
# bundle comes from the `solana-playground-client-build` context wired up by
# compose / docker buildx build-contexts).
FROM ${IMAGE} AS web-deps
WORKDIR /app
COPY web/package.json web/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production

FROM ${IMAGE}
WORKDIR /app
COPY --from=web-deps /app/node_modules node_modules
COPY --from=solana-playground-client-build /home/pg/client/build build
COPY web/server.mjs server.mjs
# Copy only runtime sources from lib/ — *.test.mjs stays out of the image.
COPY web/lib/gateway.mjs lib/gateway.mjs
ENV NODE_ENV=production
ENV PG_PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
