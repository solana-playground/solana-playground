import { FC, useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { Warning } from "../../../../Icons";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import useModal from "../../../../Modal/useModal";
import ModalInside from "../../../../Modal/ModalInside";

interface DeleteItemProps {
  path: string;
}

const DeleteItem: FC<DeleteItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);
  const { close } = useModal();

  const deleteItem = () => {
    explorer?.deleteItem(path);
    close();
    refresh();
  };

  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") deleteItem();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemName = PgExplorer.getItemNameFromPath(path);

  return (
    <ModalInside
      title
      buttonProps={{ name: "Delete", close, onSubmit: deleteItem }}
    >
      <Content>
        <Icon>
          <Warning fullSize />
        </Icon>
        <Text>
          <Main>Are you sure you want to delete '{itemName}'?</Main>
          <Desc>This action is irreversable.</Desc>
        </Text>
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

const Text = styled.div`
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
