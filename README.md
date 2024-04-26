# AElf Playground

[AElf Playground](https://playground.aelf.dev) allows you to quickly develop, deploy and test [AElf](https://docs.aelf.io) smart contracts from browsers.

> **Note:** Playground is still in **alpha** and everything is subject to change.

## Pre-requisites

- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [rustup](https://rustup.rs/)
- If you have rust installed, uninstall it first before installing rustup.

```sh
npm install -g wasm-pack # or `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Run locally

You can run the client locally by cloning the repository and running the following commands in the project directory.

Setup and start the dev server:

```sh
cd client # change directory to client
yarn setup # run the setup script(only once)
yarn start # start local dev server
```

##### Recommended versions

```sh
rustc --version
# rustc 1.75.0 (82e1608df 2023-12-21)

wasm-pack --version
# wasm-pack 0.10.3

node --version
# v18.15.0

yarn --version
# 1.22.19
```

## Contributing

Anyone is welcome to contribute to **AElf Playground** no matter how big or small.
