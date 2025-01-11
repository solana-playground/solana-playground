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

## Docker

You can also run the client locally via [Docker Compose](https://github.com/docker/compose):

```sh
docker compose up
```

**Note:** By default, this assumes you've built [the server image](https://github.com/solana-playground/solana-playground/tree/master/server#setup) before. If you don't want to run the server, you can set the `PG_SERVER` environment variable to `false` before running the command:

```sh
PG_SERVER=false docker compose up
```
