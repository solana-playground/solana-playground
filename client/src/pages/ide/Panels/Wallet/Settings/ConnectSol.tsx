import { useConnect } from "../useConnect";

export const useConnectSol = () => {
  const { solButtonStatus, connecting, disconnecting, handleConnect } =
    useConnect();

  const connectSol = () => {
    if (connecting || disconnecting) return;
    handleConnect();
  };

  return { connectSol, solButtonStatus };
};
