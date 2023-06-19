import { FC, useCallback } from "react";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import { NewItem, Share } from "./Modals";
import { PgExplorer, PgRouter, PgView } from "../../../../../../utils/pg";
import { Route } from "../../../../../../constants";
import { useNewItem } from "./useNewItem";

const ExplorerButtons = () => (
  <ButtonsWrapper>
    <NewItemButton imageName="new_file.png" title="New file" />
    <NewItemButton imageName="new_folder.png" title="New folder" />
    <NewItem />
    <CollapseAllButton />
    <ShareButton />
    <GoBackButton />
  </ButtonsWrapper>
);

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem;

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
      <img src={getExplorerIconsPath(imageName)} alt={title} />
    </Button>
  );
};

const CollapseAllButton = () => {
  const handleCollapse = useCallback(() => {
    PgExplorer.collapseAllFolders();
  }, []);

  return (
    <Button onClick={handleCollapse} kind="icon" title="Collapse folders">
      <img src={getExplorerIconsPath("collapse.png")} alt="Collapse folders" />
    </Button>
  );
};

const ShareButton = () => {
  const handleShare = async () => {
    await PgView.setModal(Share);
  };

  return (
    <Button onClick={handleShare} kind="icon" title="Share">
      <img src={getExplorerIconsPath("share.png")} alt="Share" />
    </Button>
  );
};

const GoBackButton = () => {
  const goBack = useCallback(async () => {
    await PgRouter.navigate(Route.DEFAULT);
  }, []);

  if (!PgExplorer.isShared) return null;

  return (
    <Button onClick={goBack} kind="icon" title="Go back to projects">
      <img
        src={getExplorerIconsPath("back.png")}
        alt="Go back to your project"
        style={{ height: "0.875rem", width: "0.875rem" }}
      />
    </Button>
  );
};

const getExplorerIconsPath = (name: string) => "/icons/explorer/" + name;

export default ExplorerButtons;
