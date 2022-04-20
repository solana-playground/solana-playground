import { FC, useCallback } from "react";
import styled from "styled-components";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import Button from "../../../../Button";

import NewItem from "./NewItem";
import useNewItem from "./useNewItem";

const Buttons = () => {
  return (
    <ButtonsWrapper>
      <NewItemButton image="new_file.png" title="New File" />
      <NewItemButton image="new_folder.png" title="New Folder" />
      <CollapseAllButton />
      <NewItem />
    </ButtonsWrapper>
  );
};

const ButtonsWrapper = styled.div`
  padding: 0.25rem;
  display: flex;
  justify-content: flex-end;

  & button {
    margin: 0.5rem 0;
    padding: 0 0.5rem;
  }

  & button img {
    filter: invert(0.5);
  }

  & button:hover img {
    filter: invert(1);
  }
`;

interface ButtonProps {
  image: string;
  title: string;
}

const NewItemButton: FC<ButtonProps> = ({ image, title }) => {
  const { newItem } = useNewItem();

  return (
    <Button title={title} onClick={newItem} kind="icon">
      <img src={`icons/explorer/${image}`} alt={title} />
    </Button>
  );
};

const CollapseAllButton = () => {
  const handleCollapse = useCallback(() => {
    PgExplorer.collapseAllFolders();
  }, []);

  return (
    <Button kind="icon" title="Collapse Folders" onClick={handleCollapse}>
      <img src="icons/explorer/collapse.png" alt="Collapse Folders" />
    </Button>
  );
};

export default Buttons;
