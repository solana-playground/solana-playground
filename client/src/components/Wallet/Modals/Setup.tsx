import { useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Modal from "../../Modal";
import Text from "../../Text";
import { Warning } from "../../Icons";
import { PgWallet, PgWeb3 } from "../../../utils/pg";

export const Setup = () => {
  const [text, setText] = useState("");
  const [keypair] = useState(PgWeb3.Keypair.generate);

  const handleSetup = () => {
    if (!PgWallet.accounts.length) PgWallet.add({ keypair });
    return true;
  };

  const handleExport = () => {
    if (!PgWallet.accounts.length) PgWallet.export(keypair);
    else PgWallet.export();
  };

  const handleImport = async () => {
    try {
      if (PgWallet.accounts.length) PgWallet.remove(0);
      const keypair = await PgWallet.import();
      if (keypair) setText("Imported address: " + keypair.publicKey.toBase58());
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
          <Text kind="warning" icon={<Warning color="warning" />}>
            Wallet information is stored in your browser's local storage. You
            are going to lose the wallet if you clear your browser history
            unless you save the keypair.
          </Text>
        </WarningTextWrapper>
        <WalletButtonsWrapper>
          <Button onClick={handleExport} kind="primary-outline">
            Save keypair
          </Button>
          <Button onClick={handleImport}>Import keypair</Button>
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
