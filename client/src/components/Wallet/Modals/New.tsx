import { useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Modal from "../../Modal";
import Text from "../../Text";
import { Info } from "../../Icons";
import { PgWallet } from "../../../utils/pg";

export const New = () => {
  const [keypair] = useState(PgWallet.generateKeypair());

  const handleCreate = () => PgWallet.add(null, keypair);
  const handleExport = () => PgWallet.export(keypair);

  return (
    <Modal
      title
      buttonProps={{
        text: "Create",
        onSubmit: handleCreate,
        closeOnSubmit: true,
      }}
    >
      <MainContent>
        <MainText>Are you sure you want to create a new wallet?</MainText>
        <Desc>This will create a brand new keypair.</Desc>
        <WarningTextWrapper>
          <Text IconEl={<Info />}>
            Saving the keypair will allow you to recover the wallet.
          </Text>
        </WarningTextWrapper>
        <Button onClick={handleExport}>Save wallet keypair</Button>
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

  & > button {
    margin-top: 1rem;
    width: fit-content;
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
    color: ${({ theme }) => theme.colors.state.info.color};
  }
`;
