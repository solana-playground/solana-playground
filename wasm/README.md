## Build packages

See [recommended versions](https://github.com/solana-playground/solana-playground/#recommended-versions).

Pre-requisites:

- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [rustup](https://rustup.rs/)
- If you have rust installed, uninstall it first before installing rustup.

```sh
npm install -g wasm-pack # or `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Build script usage:

```sh
./build.sh --help

Usage: build.sh [OPTIONS] <PACKAGE>

<PACKAGE>: Optional WASM package name. Builds all packages if not specified.

OPTIONS:
    -h, --help: Print help information
    -u, --update: Update client dependency
```

Build all packages:

```sh
./build.sh
```

Build a single package:

```sh
./build.sh solana-cli
```
