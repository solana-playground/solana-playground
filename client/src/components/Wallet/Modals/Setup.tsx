import { ChangeEvent, useState } from "react";
import { useAtom } from "jotai";
import { Buffer } from "buffer";
import { Keypair } from "@solana/web3.js";
import styled, { css } from "styled-components";

import DownloadButton from "../../DownloadButton";
import UploadButton from "../../UploadButton";
import Modal from "../../Modal/Modal";
import Text from "../../Text";
import { Warning } from "../../Icons";
import { pgWalletAtom } from "../../../state";
import { PgCommon, PgTerminal, PgWallet } from "../../../utils/pg";

const Setup = () => {
  const [, setPgWallet] = useAtom(pgWalletAtom);

  const [text, setText] = useState("");

  const handleSetup = async () => {
    PgWallet.update({ setupCompleted: true });
    await PgTerminal.COMMANDS.connect();
    // Update global wallet state
    setPgWallet(new PgWallet());
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeBytes(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));

      // Validate keypair
      const pkStr = Keypair.fromSecretKey(
        Uint8Array.from(buffer)
      ).publicKey.toBase58();

      setText("Imported address: " + pkStr);

      // Update local storage
      PgWallet.update({
        sk: Array.from(buffer),
      });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <Modal
      title="Playground Wallet"
      buttonProps={{
        text: "Continue",
        onSubmit: handleSetup,
        closeOnSubmit: true,
      }}
    >
      <Content>
        <ContentTitle>What is it?</ContentTitle>
        <ContentText>
          Playground wallet is a native wallet that speeds up development by
          auto-approving transactions.
        </ContentText>
      </Content>
      <Content>
        <ContentTitle>How to setup?</ContentTitle>
        <ContentText>
          You don't need to do anything other than saving the keypair for future
          use. You can also choose to import an existing wallet.
        </ContentText>
        <WarningTextWrapper>
          <Text kind="warning" IconEl={<Warning />}>
            Wallet information is stored in your browser's local storage. You
            are going to lose the wallet if you clear your browser history
            unless you save the keypair.
          </Text>
        </WarningTextWrapper>
        <WalletButtonsWrapper>
          <DownloadButton
            href={PgCommon.getUtf8EncodedString(
              Array.from(PgWallet.getKp().secretKey)
            )}
            download="keypair.json"
            buttonKind="primary-outline"
          >
            Save keypair
          </DownloadButton>
          <UploadButton accept=".json" onUpload={handleImport} showUploadText>
            Import keypair
          </UploadButton>
        </WalletButtonsWrapper>
        {text && <KeypairText>{text}</KeypairText>}
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  padding: 0 1rem;

  &:not(:first-child) {
    margin-top: 1rem;
  }
`;

const ContentTitle = styled.div`
  margin-bottom: 0.25rem;
  font-weight: bold;
`;

const ContentText = styled.p`
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

const WarningTextWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;

  & div > svg {
    height: 2rem;
    width: 2rem;
    margin-right: 1rem;
    color: ${({ theme }) => theme.colors.state.warning.color};
  }
`;

const WalletButtonsWrapper = styled.div`
  margin-top: 1rem;
  display: flex;

  & button {
    margin-right: 1rem;
  }
`;

const KeypairText = styled.div`
  ${({ theme }) => css`
    margin-top: 1rem;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;

export default Setup;
