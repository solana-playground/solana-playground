import { FC } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { Warning } from "../../../../Icons";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import ModalInside from "../../../../Modal/ModalInside";

interface DeleteItemProps {
  path: string;
}

const DeleteItem: FC<DeleteItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  const deleteItem = () => {
    explorer?.deleteItem(path);
    refresh();
  };

  const itemName = PgExplorer.getItemNameFromPath(path);

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
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.font?.size.small};
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

export default DeleteItem;
