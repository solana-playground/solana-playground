import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../Button";
import Menu from "../../Menu";
import {
  Airdrop,
  ExportFile,
  ImportFile,
  Plus,
  ThreeDots,
  Trash,
} from "../../Icons";
import { ClassName, Id } from "../../../constants";
import { PgCommand, PgView, PgWallet } from "../../../utils/pg";
import { useAirdrop } from "./useAirdrop";
import type { MenuItemProps } from "../../Menu";

export const WalletSettings = () => {
  const { airdrop, airdropCondition } = useAirdrop();

  const darken = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.add(ClassName.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  const defaultSettings: MenuItemProps[] = [
    {
      name: "Airdrop",
      onClick: airdrop,
      showCondition: airdropCondition,
      Icon: <Airdrop />,
    },
    {
      name: "Add",
      onClick: async () => {
        const { New } = await import("../Modals/New");
        await PgView.setModal(New);
      },
      Icon: <Plus />,
    },
    {
      name: "Remove",
      onClick: async () => {
        const { Remove } = await import("../Modals/Remove");
        await PgView.setModal(Remove);
      },
      kind: "error",
      Icon: <Trash />,
    },
    {
      name: "Import",
      onClick: () => PgWallet.import(null),
      Icon: <ImportFile />,
    },
    {
      name: "Export",
      onClick: () => PgWallet.export(),
      Icon: <ExportFile />,
    },
  ];

  const standardWalletSettings: MenuItemProps[] = PgWallet.standardWallets.map(
    (wallet) => ({
      name: wallet.adapter.connected
        ? `Disconnect from ${wallet.adapter.name}`
        : `Connect to ${wallet.adapter.name}`,
      onClick: async () => {
        await PgCommand.connect.run(wallet.adapter.name);
      },
      kind: "secondary",
      Icon: <img src={wallet.adapter.icon} alt={wallet.adapter.name} />,
    })
  );

  return (
    <Wrapper>
      <Menu
        kind="dropdown"
        items={defaultSettings.concat(standardWalletSettings)}
        onShow={darken}
        onHide={lighten}
      >
        <Button kind="icon" title="More">
          <ThreeDots />
        </Button>
      </Menu>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  left: 1rem;
`;
