import { FC } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Modal from "../../../../../Modal";
import { Warning } from "../../../../../Icons";
import { explorerAtom } from "../../../../../../state";
import { PgExplorer } from "../../../../../../utils/pg";

interface DeleteItemProps {
  path: string;
}

export const DeleteItem: FC<DeleteItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);

  const deleteItem = async () => {
    if (!explorer) return;

    try {
      await explorer.deleteItem(path);
    } catch (e: any) {
      console.log(e.message);
    }
  };

  const itemName = PgExplorer.getItemNameFromPath(path);

  if (!itemName) return null;

  return (
    <Modal
      title
      buttonProps={{
        name: "Delete",
        onSubmit: deleteItem,
        closeOnSubmit: true,
      }}
    >
      <Content>
        <Icon>
          <Warning fullSize />
        </Icon>
        <ContentText>
          <Main>Are you sure you want to delete '{itemName}'?</Main>
          <Desc>This action is irreversable.</Desc>
        </ContentText>
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
    font-size: ${theme.font?.code?.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;
