- Open a Command Prompt (`cmd.exe`) as an Administrator and run the following command:

```sh
cmd /c "curl https://release.anza.xyz/stable/agave-install-init-x86_64-pc-windows-msvc.exe --output C:\agave-install-tmp\agave-install-init.exe --create-dirs"
```

- Run the following command to install the stable version of Solana.
  If you see a security pop-up by your system, select to allow the program to run.

```sh
C:\agave-install-tmp\agave-install-init.exe stable
```
