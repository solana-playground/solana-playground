import { useCallback } from "react";
import styled, { css } from "styled-components";

import Button from "../../../components/Button";
import Tooltip from "../../../components/Tooltip";
import { useWallet } from "../../../hooks";
import { PgCommand, PgTheme } from "../../../utils/pg";

export const Wallet = () => {
  const { wallet, walletPkStr } = useWallet();

  // Using a callback because this function might be resolved later than the
  // mount of this component
  const connect = useCallback(() => PgCommand.connect.run(), []);

  return (
    <Tooltip element="Toggle Playground Wallet">
      <ConnectButton
        onClick={connect}
        kind="transparent"
        leftIcon={<WalletStatus isConnected={!!walletPkStr} />}
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
    ${PgTheme.convertToCSS(theme.components.bottom.connect)};
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
