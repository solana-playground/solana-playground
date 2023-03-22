## Build packages

See [recommended versions](https://github.com/solana-playground/solana-playground/#recommended-versions).

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
