import { FC } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import ModalInside from "../../../../Modal/ModalInside";
import { Warning } from "../../../../Icons";
import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";

interface DeleteItemProps {
  path: string;
}

const DeleteItem: FC<DeleteItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  const deleteItem = async () => {
    if (!explorer) return;

    try {
      await explorer.deleteItem(path);
      refresh();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  const itemName = PgExplorer.getItemNameFromPath(path);

  if (!itemName) return null;

  return (
    <ModalInside title buttonProps={{ name: "Delete", onSubmit: deleteItem }}>
      <Content>
        <Icon>
          <Warning fullSize />
        </Icon>
        <ContentText>
          <Main>Are you sure you want to delete '{itemName}'?</Main>
          <Desc>This action is irreversable.</Desc>
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

export default DeleteItem;
