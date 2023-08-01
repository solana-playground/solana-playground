# Solana Playground

[SolPg](https://beta.solpg.io) allows you to quickly develop, deploy and test [Solana](https://docs.solana.com/introduction) programs(smart contracts) from the browser.

## Supported crates:

| Package                                                                            | Version |
| ---------------------------------------------------------------------------------- | ------- |
| [anchor-lang](https://docs.rs/anchor-lang/0.27.0)                                  | 0.27.0  |
| [anchor-spl](https://docs.rs/anchor-spl/0.27.0)                                    | 0.27.0  |
| [arrayref](https://docs.rs/arrayref/0.3.7)                                         | 0.3.7   |
| [borsh](https://docs.rs/borsh/0.9.3)                                               | 0.9.3   |
| [borsh-derive](https://docs.rs/borsh-derive/0.9.3)                                 | 0.9.3   |
| [bytemuck](https://docs.rs/bytemuck/1.13.1)                                        | 1.13.1  |
| [bytemuck-derive](https://docs.rs/bytemuck-derive/1.4.1)                           | 1.4.1   |
| [clockwork-sdk](https://docs.rs/clockwork-sdk/2.0.17)                              | 2.0.17  |
| [mpl-token-metadata](https://docs.rs/mpl-token-metadata/1.10.0)                    | 1.10.0  |
| [mpl-token-vault](https://docs.rs/mpl-token-vault/0.2.0)                           | 0.2.0   |
| [num-derive](https://docs.rs/num-derive/0.3.3)                                     | 0.3.3   |
| [num-traits](https://docs.rs/num-traits/0.2.15)                                    | 0.2.15  |
| [pyth-sdk](https://docs.rs/pyth-sdk/0.7.0)                                         | 0.7.0   |
| [pyth-sdk-solana](https://docs.rs/pyth-sdk-solana/0.7.1)                           | 0.7.1   |
| [solana-program](https://docs.rs/solana-program/1.14.17)                           | 1.14.17 |
| [spl-associated-token-account](https://docs.rs/spl-associated-token-account/1.1.3) | 1.1.3   |
| [spl-token](https://docs.rs/spl-token/3.5.0)                                       | 3.5.0   |
| [switchboard-v2](https://docs.rs/switchboard-v2/0.1.23)                            | 0.1.23  |
| [thiserror](https://docs.rs/thiserror/1.0.40)                                      | 1.0.40  |

You can open an issue to request more crates.

> **Note:** Playground is still in **beta** and everything is subject to change.

## Run locally

You can run the client locally by cloning the repository and running the following commands in the project directory.

Setup and start the dev server:

```sh
cd client # change directory to client
yarn setup # run the setup script(only once)
yarn start # start local dev server
```

##### Recommended versions:

```sh
rustc --version
# rustc 1.71.0 (8ede3aae2 2023-07-12)

wasm-pack --version
# wasm-pack 0.10.3

node --version
# v18.15.0

yarn --version
# 1.22.19
```

## Contributing

Anyone is welcome to contribute to **Solana Playground** no matter how big or small.

## License

`client` and `vscode` is licensed under [GPL-3.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-GPL).
`wasm` packages are licensed under [Apache-2.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-APACHE) unless specified otherwise in their respective `Cargo.toml`.
