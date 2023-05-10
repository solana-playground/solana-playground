import { useConnect } from "../../../hooks";

export const useConnectSol = () => {
  const { solButtonStatus, connecting, disconnecting, handleConnect } =
    useConnect();

  const connectSol = async () => {
    if (connecting || disconnecting) return;
    await handleConnect();
  };

  return { connectSol, solButtonStatus };
};
