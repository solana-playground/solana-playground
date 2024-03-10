# Solana Playground

[SolPg](https://beta.solpg.io) allows you to quickly develop, deploy and test [Solana](https://docs.solana.com/introduction) programs(smart contracts) from browsers.

## Supported crates

| Crate                                                                              | Version |
| ---------------------------------------------------------------------------------- | ------- |
| [anchor-lang](https://docs.rs/anchor-lang/0.29.0)                                  | 0.29.0  |
| [anchor-spl](https://docs.rs/anchor-spl/0.29.0)                                    | 0.29.0  |
| [arrayref](https://docs.rs/arrayref/0.3.7)                                         | 0.3.7   |
| [borsh](https://docs.rs/borsh/0.10.3)                                              | 0.10.3  |
| [borsh-derive](https://docs.rs/borsh-derive/0.10.3)                                | 0.10.3  |
| [bytemuck](https://docs.rs/bytemuck/1.14.0)                                        | 1.14.0  |
| [bytemuck_derive](https://docs.rs/bytemuck_derive/1.5.0)                           | 1.5.0   |
| [mpl-bubblegum](https://docs.rs/mpl-bubblegum/1.0.0)                               | 1.0.0   |
| [mpl-token-auth-rules](https://docs.rs/mpl-token-auth-rules/1.4.3)                 | 1.4.3   |
| [mpl-token-metadata](https://docs.rs/mpl-token-metadata/3.2.3)                     | 3.2.3   |
| [num-derive](https://docs.rs/num-derive/0.4.0)                                     | 0.4.0   |
| [num-traits](https://docs.rs/num-traits/0.2.16)                                    | 0.2.16  |
| [pyth-sdk](https://docs.rs/pyth-sdk/0.8.0)                                         | 0.8.0   |
| [pyth-sdk-solana](https://docs.rs/pyth-sdk-solana/0.8.0)                           | 0.8.0   |
| [serde](https://docs.rs/serde/1.0.193)                                             | 1.0.193 |
| [solana-program](https://docs.rs/solana-program/1.16.24)                           | 1.16.24 |
| [spl-account-compression](https://docs.rs/spl-account-compression/0.2.0)           | 0.2.0   |
| [spl-associated-token-account](https://docs.rs/spl-associated-token-account/2.2.0) | 2.2.0   |
| [spl-pod](https://docs.rs/spl-pod/0.1.0)                                           | 0.1.0   |
| [spl-tlv-account-resolution](https://docs.rs/spl-tlv-account-resolution/0.4.0)     | 0.4.0   |
| [spl-token](https://docs.rs/spl-token/4.0.0)                                       | 4.0.0   |
| [spl-token-2022](https://docs.rs/spl-token-2022/0.9.0)                             | 0.9.0   |
| [spl-token-metadata-interface](https://docs.rs/spl-token-metadata-interface/0.2.0) | 0.2.0   |
| [spl-transfer-hook-interface](https://docs.rs/spl-transfer-hook-interface/0.3.0)   | 0.3.0   |
| [spl-type-length-value](https://docs.rs/spl-type-length-value/0.3.0)               | 0.3.0   |
| [switchboard-solana](https://docs.rs/switchboard-solana/0.29.79)                   | 0.29.79 |
| [switchboard-v2](https://docs.rs/switchboard-v2/0.4.0)                             | 0.4.0   |
| [thiserror](https://docs.rs/thiserror/1.0.48)                                      | 1.0.48  |

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

Anyone is welcome to contribute to **Solana Playground** no matter how big or small.

## License

Public libraries(e.g. [solana-client-wasm](https://github.com/solana-playground/solana-playground/tree/master/wasm/solana-client), [solana-extra-wasm](https://github.com/solana-playground/solana-playground/tree/master/wasm/utils/solana-extra)) are licensed under [Apache-2.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-APACHE) and the rest are licensed under [GPL-3.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-GPL).
