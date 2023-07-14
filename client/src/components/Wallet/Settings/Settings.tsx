import { FC, useCallback } from "react";
import styled from "styled-components";

import Button from "../../Button";
import Menu, { MenuItemProps } from "../../Menu";
import {
  Airdrop,
  Copy,
  Edit,
  ExportFile,
  ImportFile,
  Plus,
  ThreeDots,
  Trash,
} from "../../Icons";
import { ClassName, Id } from "../../../constants";
import { Fn, PgCommand, PgView, PgWallet } from "../../../utils/pg";
import { useAirdrop } from "./useAirdrop";
import { useCopy } from "../../../hooks";

interface WalletSettingsProps {
  showRename: Fn;
}

export const WalletSettings: FC<WalletSettingsProps> = ({ showRename }) => {
  const { airdrop, airdropCondition } = useAirdrop();

  const darken = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.add(ClassName.DARKEN);
  }, []);

  const lighten = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  const [, copyAddress] = useCopy(PgWallet.current?.publicKey.toBase58()!);

  const isPg = !!PgWallet.current?.isPg;

  const defaultSettings: MenuItemProps[] = [
    {
      name: "Copy address",
      onClick: copyAddress,
      Icon: <Copy />,
    },
    {
      name: "Airdrop",
      onClick: airdrop,
      showCondition: airdropCondition,
      Icon: <Airdrop />,
    },
    {
      name: "Add",
      onClick: async () => {
        const { Add } = await import("../Modals/Add");
        await PgView.setModal(Add);
      },
      Icon: <Plus />,
    },
    {
      name: "Rename",
      onClick: showRename,
      Icon: <Edit />,
      showCondition: isPg,
    },
    {
      name: "Remove",
      onClick: async () => {
        const { Remove } = await import("../Modals/Remove");
        await PgView.setModal(Remove);
      },
      hoverColor: "error",
      Icon: <Trash />,
      showCondition: isPg,
    },
    {
      name: "Import",
      onClick: PgWallet.import,
      Icon: <ImportFile />,
    },
    {
      name: "Export",
      onClick: PgWallet.export,
      Icon: <ExportFile />,
      showCondition: isPg,
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
      hoverColor: "secondary",
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
