## Client

This is the main application of Solana Playground.

## Setup

For the initial setup, run:

```sh
yarn setup
```

Start the dev server:

```sh
yarn start
```

## Deployment

For Vercel deployment instructions, see [Deploy client to Vercel](docs/deploy-client-vercel.md).

## Docker

You can run the client locally via [Docker Compose](https://github.com/docker/compose):

```sh
docker compose -f ../compose.yaml --profile dev up --build
```

### Standalone (client only, without the server)

To run only the client without building or depending on the server, use the `standalone` profile. The client will use the production API (`https://api.solpg.io`) instead of a local server:

```sh
docker compose -f ../compose.yaml --profile standalone up --build
```

See the [root README](../README.md#run-with-docker) for more options.
