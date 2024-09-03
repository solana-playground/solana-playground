import { useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Input from "../../Input";
import Modal from "../../Modal";
import Text from "../../Text";
import { Info } from "../../Icons";
import { PgWallet, PgWeb3 } from "../../../utils/pg";

export const Add = () => {
  const [keypair] = useState(PgWeb3.Keypair.generate);
  const [name, setName] = useState(PgWallet.getNextAvailableAccountName());
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => PgWallet.add({ name, keypair });
  const handleExport = () => PgWallet.export(keypair);

  return (
    <Modal
      title
      buttonProps={{
        text: "Create",
        onSubmit: handleCreate,
      }}
      error={error}
      setError={setError}
    >
      <MainContent>
        <MainText>Are you sure you want to create a new wallet?</MainText>
        <Desc>This will create a brand new keypair.</Desc>

        <InputWrapper>
          <InputLabel>Account name</InputLabel>
          <Input
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            validator={PgWallet.validateAccountName}
            error={error}
            setError={setError}
          />
        </InputWrapper>

        <WarningTextWrapper>
          <Text icon={<Info color="info" />}>
            Saving the keypair will allow you to recover the wallet.
          </Text>
        </WarningTextWrapper>
        <Button onClick={handleExport}>Save keypair</Button>
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
    margin-top: 0.5rem;
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
  }
`;

const InputWrapper = styled.div`
  margin-top: 0.75rem;
`;

const InputLabel = styled.div`
  margin-bottom: 0.25rem;
  font-weight: bold;
`;
