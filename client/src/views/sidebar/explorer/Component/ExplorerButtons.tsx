import { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Img from "../../../../components/Img";
import { NewItem, Share } from "./Modals";
import { PgExplorer, PgRouter, PgView } from "../../../../utils/pg";
import { useNewItem } from "./useNewItem";

const ExplorerButtons = () => (
  <ButtonsWrapper>
    <NewItemButton imageName="new_file.png" title="New file" />
    <NewItemButton imageName="new_folder.png" title="New folder" />
    <NewItem />
    <CollapseAllButton />
    <ShareButton />
    {PgExplorer.isTemporary && <GoBackButton />}
  </ButtonsWrapper>
);

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.5rem;

  & button {
    margin: 0.5rem 0;
    padding: 0 0.5rem;
  }

  & button img {
    filter: invert(0.5);
  }

  & button:hover {
    color: initial;
    background: initial;

    & img {
      filter: invert(${({ theme }) => (theme.isDark ? 1 : 0)});
    }
  }
`;

interface ButtonProps {
  imageName: string;
  title: string;
}

const NewItemButton: FC<ButtonProps> = ({ imageName, title }) => {
  const { newItem } = useNewItem();

  return (
    <Button onClick={newItem} kind="icon" title={title}>
      <Img src={getExplorerIconsPath(imageName)} alt={title} />
    </Button>
  );
};

const CollapseAllButton = () => (
  <Button
    onClick={() => PgExplorer.collapseAllFolders()}
    kind="icon"
    title="Collapse folders"
  >
    <Img src={getExplorerIconsPath("collapse.png")} alt="Collapse folders" />
  </Button>
);

const ShareButton = () => (
  <Button onClick={() => PgView.setModal(Share)} kind="icon" title="Share">
    <Img src={getExplorerIconsPath("share.png")} alt="Share" />
  </Button>
);

const GoBackButton = () => (
  <Button
    onClick={() => PgRouter.navigate()}
    kind="icon"
    title="Go back to projects"
  >
    <Img
      src={getExplorerIconsPath("back.png")}
      alt="Go back to your project"
      style={{ height: "0.875rem", width: "0.875rem" }}
    />
  </Button>
);

const getExplorerIconsPath = (name: string) => "/icons/explorer/" + name;

export default ExplorerButtons;
