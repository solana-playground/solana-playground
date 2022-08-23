import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import { Warning } from "../../../../../Icons";
import { explorerAtom } from "../../../../../../state";

export const DeleteWorkspace = () => {
  const [explorer] = useAtom(explorerAtom);

  if (!explorer) return null;

  const deleteWorkspace = async () => {
    try {
      await explorer.deleteWorkspace();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <ModalInside
      title
      buttonProps={{
        name: "Delete",
        onSubmit: deleteWorkspace,
      }}
    >
      <Content>
        <Icon>
          <Warning fullSize />
        </Icon>
        <ContentText>
          <Main>
            Are you sure you want to delete '{explorer.currentWorkspaceName}'?
          </Main>
          <Desc>This action is irreversable!</Desc>
          <Desc>- All files and folders will be deleted.</Desc>
          <Desc>- Program credentials will be deleted.</Desc>
        </ContentText>
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
`;

const Icon = styled.div`
  width: 2rem;
  height: 2rem;
`;

const ContentText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
`;

const Main = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;
