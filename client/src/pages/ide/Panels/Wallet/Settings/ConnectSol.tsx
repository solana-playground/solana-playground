import { FC } from "react";

import { SettingsItem, SettingsItemProps } from "./SettingsItem";
import { useConnect } from "../useConnect";

export const ConnectSol: FC<SettingsItemProps> = ({ close }) => {
  const { solButtonStatus, connecting, disconnecting, handleConnect } =
    useConnect();

  const handleClick = () => {
    if (connecting || disconnecting) return;

    handleConnect();
    close();
  };

  return <SettingsItem onClick={handleClick}>{solButtonStatus}</SettingsItem>;
};
