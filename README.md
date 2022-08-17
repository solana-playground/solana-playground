# Solana Playground

[SolPg](https://beta.solpg.io) allows you to quickly develop, deploy and test [Solana](https://docs.solana.com/introduction) programs(smart contracts) from the browser.

## Supported crates:

| Package                                                                            | Version |
| ---------------------------------------------------------------------------------- | ------- |
| [anchor-lang](https://docs.rs/anchor-lang/0.25.0)                                  | 0.25.0  |
| [anchor-spl](https://docs.rs/anchor-spl/0.25.0)                                    | 0.25.0  |
| [arrayref](https://docs.rs/arrayref/0.3.6)                                         | 0.3.6   |
| [borsh](https://docs.rs/borsh/0.9.3)                                               | 0.9.3   |
| [borsh-derive](https://docs.rs/borsh-derive/0.9.3)                                 | 0.9.3   |
| [bytemuck](https://docs.rs/bytemuck/1.9.1)                                         | 1.9.1   |
| [bytemuck-derive](https://docs.rs/bytemuck-derive/1.2.1)                           | 1.2.1   |
| [mpl-token-metadata](https://docs.rs/mpl-token-metadata/1.3.4)                     | 1.3.4   |
| [mpl-token-vault](https://docs.rs/mpl-token-vault/0.1.0)                           | 0.1.1   |
| [num-derive](https://docs.rs/num-derive/0.3.3)                                     | 0.3.3   |
| [num-traits](https://docs.rs/num-traits/0.2.15)                                    | 0.2.15  |
| [solana-program](https://docs.rs/solana-program/1.10.35)                           | 1.10.35 |
| [spl-associated-token-account](https://docs.rs/spl-associated-token-account/1.0.5) | 1.0.5   |
| [spl-token](https://docs.rs/spl-token/3.3.1)                                       | 3.3.1   |
| [thiserror](https://docs.rs/thiserror/1.0.32)                                      | 1.0.32  |

You can open an issue to request more crates.

> **Note:** Playground is still in **beta** and everything is subject to change.

## Run locally

You can run the client locally by cloning the repo and running these commands in the project directory.

```sh
cd client # change directory to client
yarn # install dependencies
yarn start # start local dev server
```

## Contributing

Anyone is welcome to contribute to **Solana Playground** no matter how big or small.

## License

`client` is licensed under [GPL-3.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-GPL).
`wasm` packages are licensed under [Apache-2.0](https://github.com/solana-playground/solana-playground/blob/master/LICENSE-APACHE) unless specified otherwise in their respective `Cargo.toml`.
