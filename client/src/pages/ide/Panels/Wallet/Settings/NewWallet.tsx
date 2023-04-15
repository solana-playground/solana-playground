import { useAtom } from "jotai";
import { Keypair } from "@solana/web3.js";
import styled, { css } from "styled-components";

import DownloadButton from "../../../../../components/DownloadButton";
import Modal from "../../../../../components/Modal/Modal";
import Text from "../../../../../components/Text";
import { Warning } from "../../../../../components/Icons";
import { pgWalletAtom } from "../../../../../state";
import { PgCommon, PgModal, PgWallet } from "../../../../../utils/pg";

export const useNewWallet = () => {
  return {
    handleNewWallet: () => {
      PgModal.set(NewWalletModal);
    },
  };
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
        text: "Create",
        onSubmit: generateNewKeypair,
        closeOnSubmit: true,
      }}
    >
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
    </Modal>
  );
};

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem;

  & > a {
    margin-top: 1rem;
  }
`;
const MainText = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.font.code.size.small};
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
