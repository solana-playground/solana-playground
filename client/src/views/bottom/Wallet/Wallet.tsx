import { useCallback } from "react";
import styled, { css } from "styled-components";

import Button from "../../../components/Button";
import Tooltip from "../../../components/Tooltip";
import { useWallet } from "../../../hooks";
import { PgCommand } from "../../../utils";

export const Wallet = () => {
  const wallet = useWallet();

  // Using a callback because this function might be resolved later than the
  // mount of this component
  const connect = useCallback(() => PgCommand.connect.execute(), []);

  return (
    <Tooltip element="Toggle Playground Wallet">
      <ConnectButton
        onClick={connect}
        kind="transparent"
        leftIcon={<WalletStatus isConnected={!!wallet} />}
      >
        {wallet
          ? wallet.isPg
            ? "Connected to Playground Wallet"
            : `Connected to ${wallet.name}`
          : "Not connected"}
      </ConnectButton>
    </Tooltip>
  );
};

const ConnectButton = styled(Button)`
  ${({ theme }) => css`
    height: 100%;
    padding: 0 0.75rem;
    margin-right: -0.5rem;
    border: none;

    &:hover {
      background: ${theme.views.bottom.default.color +
      theme.default.transparency.low};
    }
  `}
`;

const WalletStatus = styled.span<{ isConnected: boolean }>`
  ${({ isConnected, theme }) => css`
    &::before {
      content: "";
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      background: ${isConnected
        ? theme.colors.state.success.color
        : theme.colors.state.error.color};
    }
  `}
`;
