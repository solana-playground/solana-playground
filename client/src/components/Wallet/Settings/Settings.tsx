import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../Button";
import Menu from "../../Menu";
import { ThreeDots } from "../../Icons";
import { ClassName, Id } from "../../../constants";
import { PgView, PgWallet } from "../../../utils/pg";
import { useAirdrop } from "./useAirdrop";
import { useConnect } from "../../../hooks";

export const WalletSettings = () => {
  const { airdrop, airdropCondition } = useAirdrop();
  const { handleConnect, solButtonStatus } = useConnect();

  const darken = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.add(ClassName.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  return (
    <Wrapper>
      <Menu
        kind="dropdown"
        items={[
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
          {
            name: solButtonStatus,
            onClick: handleConnect,
          },
        ]}
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
