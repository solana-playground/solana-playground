# Solana Playground

Commands and snippets to help Solana development.

> 💡️ Rust/Solana toolchain is not necessary for the extension to work.

## Commands

Commands are accessed via the Command Palette (`Ctrl+Shift+P` on Windows and Linux or `Cmd+Shift+P` on macOS). You can type **solpg** to see all commands.

> ⚠ Commands usually require VSCode to be in a program workspace to work properly. If you don't have a program, use one of the **Create** commands.

![Commands](https://raw.githubusercontent.com/solana-playground/solana-playground/master/vscode/images/commands.gif)

> ️You can also create keybinds for any of the commands by opening the Command Palette and clicking the Gear(⚙️) icon next to the command that you want to add keybind for.

### Create a template project

You can create default projects by opening the Command Palette and choose one of the following commands:

- Create Solana(Native) Project
- Create Anchor Project
- Create Seahorse Project

### Address

You can see your address with **Address** command. This is generated automatically if you don't have Solana CLI installed.

### Balance

You can see your balance with **Balance** command.

### Airdrop

You can airdrop yourself SOL with **Airdrop** command.

### Connection

You can get/set connection RPC endpoint and commitment with **Connection** command. This command uses Solana CLI configuration if it exists.

### Build

You can build your program with **Build** command.

### Deploy

You can deploy your program with **Build** command.

### Share

You can share your program with **Share** command.

## Snippets

The extension also comes with program snippets from [Solana Playground](https://beta.solpg.io).

### Anchor

![Anchor Snippets](https://raw.githubusercontent.com/solana-playground/solana-playground/master/vscode/images/anchor-snippets.gif)

### Seahorse

![Seahorse Snippets](https://raw.githubusercontent.com/solana-playground/solana-playground/master/vscode/images/seahorse-snippets.gif)
