import styled, { css } from "styled-components";

import Modal from "../../../../../components/Modal";
import { Warning } from "../../../../../components/Icons";
import { PgExplorer } from "../../../../../utils/pg";

export const DeleteWorkspace = () => {
  const deleteWorkspace = async () => {
    await PgExplorer.deleteWorkspace();
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Delete",
        onSubmit: deleteWorkspace,
        kind: "error",
      }}
    >
      <Content>
        <IconWrapper>
          <Warning color="warning" />
        </IconWrapper>
        <ContentText>
          <Main>
            Are you sure you want to delete workspace '
            {PgExplorer.currentWorkspaceName}'?
          </Main>
          <Desc>This action is irreversable!</Desc>
          <Desc>- All files and folders will be deleted.</Desc>
          <Desc>- Program credentials will be deleted.</Desc>
        </ContentText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IconWrapper = styled.div`
  & > svg {
    width: 3rem;
    height: 3rem;
  }
`;

const ContentText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
`;

const Main = styled.span`
  font-weight: bold;
  word-break: break-all;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;
