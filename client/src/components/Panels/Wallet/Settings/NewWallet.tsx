import { FC } from "react";
import { useAtom } from "jotai";
import { Keypair } from "@solana/web3.js";
import styled, { css } from "styled-components";

import DownloadButton from "../../../DownloadButton";
import Modal from "../../../Modal/Modal";
import Text from "../../../Text";
import { SettingsItem, SettingsItemProps } from "./SettingsItem";
import { Warning } from "../../../Icons";
import { PgCommon, PgModal, PgWallet } from "../../../../utils/pg";
import { pgWalletAtom } from "../../../../state";

export const NewWallet: FC<SettingsItemProps> = ({ close }) => {
  const handleNew = () => {
    PgModal.set(NewWalletModal);
    close();
  };

  return <SettingsItem onClick={handleNew}>New Wallet</SettingsItem>;
};

const NewWalletModal = () => {
  const [, setPgWallet] = useAtom(pgWalletAtom);

  const generateNewKeypair = () => {
    // Generate new keypair
    const kp = Keypair.generate();

    // Update localstorage
    PgWallet.update({
      sk: Array.from(kp.secretKey),
    });

    // Update global wallet state
    setPgWallet(new PgWallet());
  };

  return (
    <Modal
      title
      buttonProps={{
        name: "Create",
        onSubmit: generateNewKeypair,
        closeOnSubmit: true,
      }}
    >
      <Content>
        <MainContent>
          <MainText>Are you sure you want to create a new wallet?</MainText>
          <Desc>This will create a brand new keypair.</Desc>
          <WarningTextWrapper>
            <Text type="Warning" IconEl={<Warning />}>
              The old keypair will be lost if you don't save it.
            </Text>
          </WarningTextWrapper>
          <DownloadButton
            href={PgCommon.getUtf8EncodedString(
              Array.from(PgWallet.keypairBytes)
            )}
            download="wallet-keypair.json"
          >
            Save wallet keypair
          </DownloadButton>
        </MainContent>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;

  & > a {
    margin-top: 1rem;
  }
`;
const MainText = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.font?.code?.size.small};
    color: ${theme.colors.default.textSecondary};
    margin-top: 0.5rem;
  `}
`;

const WarningTextWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;

  & svg {
    height: 2rem;
    width: 2rem;
    margin-right: 1rem;
    color: ${({ theme }) => theme.colors.state.warning.color} !important;
  }
`;
