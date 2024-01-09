import styled, { css } from "styled-components";

import Button from "../../Button";
import Modal from "../../Modal";
import Text from "../../Text";
import { Warning } from "../../Icons";
import { PgWallet } from "../../../utils/pg";

export const Remove = () => {
  const handleRemove = () => PgWallet.remove();
  const handleExport = () => PgWallet.export();

  return (
    <Modal
      title
      buttonProps={{
        text: "Remove",
        kind: "error",
        onSubmit: handleRemove,
      }}
    >
      <MainContent>
        <MainText>Are you sure you want to remove the current wallet?</MainText>
        <Desc>This action is irreversable!</Desc>
        <WarningTextWrapper>
          <Text icon={<Warning color="warning" />}>
            You can recover the wallet later if you save the keypair.
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
  }
`;
