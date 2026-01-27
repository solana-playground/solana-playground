### How to run locally

- Install tools

Instructions on how to install [Anchor](https://github.com/coral-xyz/anchor) can be found [here](https://www.anchor-lang.com/docs/installation).

- Install dependencies

Extract the zip file in your project's directory and run:

```
yarn
```

- Build

```
anchor build
```

- Test

```
anchor test
```

- Run client

```
anchor run client
```

> **Note**
> You might need to adjust the client and test code to fully work in local Node environment since there are playground exclusive features, e.g. if you are using `pg.wallets.myWallet`, you'll need to manually load each keypair.
