import { FC } from "react";
import styled from "styled-components";

import Button from "../Button";
import Img from "../Img";
import Menu, { MenuItemProps } from "../Menu";
import {
  Airdrop,
  Copy,
  Edit,
  ExportFile,
  ImportFile,
  Plus,
  ThreeDots,
  Trash,
} from "../Icons";
import { Fn, PgCommand, PgView, PgWallet } from "../../utils/pg";
import { useAirdrop, useDarken } from "./hooks";
import { useCopy } from "../../hooks";

interface SettingsProps {
  showRename: Fn;
}

const Settings: FC<SettingsProps> = ({ showRename }) => {
  const { airdrop, airdropCondition } = useAirdrop();
  const { darken, lighten } = useDarken();

  const [, copyAddress] = useCopy(PgWallet.current?.publicKey.toBase58()!);

  const isPg = !!PgWallet.current?.isPg;

  const defaultSettings: MenuItemProps[] = [
    {
      name: "Copy address",
      onClick: copyAddress,
      icon: <Copy />,
    },
    {
      name: "Airdrop",
      onClick: airdrop,
      showCondition: airdropCondition,
      icon: <Airdrop />,
    },
    {
      name: "Add",
      onClick: async () => {
        const { Add } = await import("./Modals/Add");
        await PgView.setModal(Add);
      },
      icon: <Plus />,
    },
    {
      name: "Rename",
      onClick: showRename,
      icon: <Edit />,
      showCondition: isPg,
    },
    {
      name: "Remove",
      onClick: async () => {
        const { Remove } = await import("./Modals/Remove");
        await PgView.setModal(Remove);
      },
      hoverColor: "error",
      icon: <Trash />,
      showCondition: isPg,
    },
    {
      name: "Import",
      onClick: PgWallet.import,
      icon: <ImportFile />,
    },
    {
      name: "Export",
      onClick: PgWallet.export,
      icon: <ExportFile />,
      showCondition: isPg,
    },
  ];

  const standardWalletSettings: MenuItemProps[] = PgWallet.standardWallets.map(
    (wallet) => ({
      name: wallet.adapter.connected
        ? `Disconnect from ${wallet.adapter.name}`
        : `Connect to ${wallet.adapter.name}`,
      onClick: () => PgCommand.connect.run(wallet.adapter.name),
      hoverColor: "secondary",
      icon: <Img src={wallet.adapter.icon} alt={wallet.adapter.name} />,
    })
  );

  return (
    <Wrapper>
      <Menu.Dropdown
        items={defaultSettings.concat(standardWalletSettings)}
        onShow={darken}
        onHide={lighten}
      >
        <Button kind="icon" title="More">
          <ThreeDots />
        </Button>
      </Menu.Dropdown>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  left: 1rem;
`;

export default Settings;
