import { useWallet } from "../../../../hooks/useWallet";

/** Get the wallet connection status. */
export const useConnectionStatus = () => {
  const wallet = useWallet().wallet;
  const connectionStatus = wallet
    ? wallet.isPg
      ? "Connected to Playground Wallet"
      : `Connected to ${wallet.name}`
    : "Not connected";

  return { connectionStatus };
};
