import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../Button";
import Menu from "../../Menu";
import { ThreeDots } from "../../Icons";
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
    },
    {
      name: "Add",
      onClick: async () => {
        const { New } = await import("../Modals/New");
        await PgView.setModal(New);
      },
    },
    {
      name: "Remove",
      onClick: async () => {
        const { Remove } = await import("../Modals/Remove");
        await PgView.setModal(Remove);
      },
      kind: "error",
    },
    {
      name: "Import",
      onClick: () => PgWallet.import(null),
    },
    {
      name: "Export",
      onClick: () => PgWallet.export(),
    },
  ];

  const standardWalletSettings: MenuItemProps[] = PgWallet.standardWallets.map(
    (standard) => ({
      name: standard.adapter.connected
        ? `Disconnect from ${standard.adapter.name}`
        : `Connect to ${standard.adapter.name}`,
      onClick: async () => {
        await PgCommand.connect.run(standard.adapter.name);
      },
      kind: "secondary",
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
