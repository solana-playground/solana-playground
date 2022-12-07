## How to build packages

Toolchain:

```sh
rustc --version
# rustc 1.65.0 (897e37553 2022-11-02)
wasm-pack --version
# wasm-pack 0.10.3
```

Run:

```sh
# In the directory you want to build(e.g solana-cli)
wasm-pack build
```

Update a package:, eg. solana-cli:

```sh
./update.sh solana-cli
```

This will:

- Run wasm-pack build
- Update the code in pkgs/ for the package
- Update the client dependency on that package
