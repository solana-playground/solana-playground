import { FC, useCallback } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import useNewItem from "./useNewItem";
import { NewItem, Share } from "./Modals";
import { explorerAtom, modalAtom } from "../../../../../state";
import { PgExplorer, PgRouter } from "../../../../../utils/pg";
import { Route } from "../../../../../constants";

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
    background-color: initial;

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
      <img src={PgExplorer.getExplorerIconsPath(imageName)} alt={title} />
    </Button>
  );
};

const CollapseAllButton = () => {
  const handleCollapse = useCallback(() => {
    PgExplorer.collapseAllFolders();
  }, []);

  return (
    <Button onClick={handleCollapse} kind="icon" title="Collapse folders">
      <img
        src={PgExplorer.getExplorerIconsPath("collapse.png")}
        alt="Collapse folders"
      />
    </Button>
  );
};

const ShareButton = () => {
  const [, setModal] = useAtom(modalAtom);

  const handleShare = () => {
    setModal(<Share />);
  };

  return (
    <Button onClick={handleShare} kind="icon" title="Share">
      <img src={PgExplorer.getExplorerIconsPath("share.png")} alt="Share" />
    </Button>
  );
};

const GoBackButton = () => {
  const [explorer, setExplorer] = useAtom(explorerAtom);

  const goBack = useCallback(async () => {
    // Checking whether the user has workspaces to validate state
    const _explorer = new PgExplorer(() => {});
    await _explorer.init();
    if (!_explorer.hasWorkspaces()) {
      setExplorer(null);
    }
    await PgRouter.navigate(Route.DEFAULT);
  }, [setExplorer]);

  if (!explorer?.isShared) return null;

  return (
    <Button onClick={goBack} kind="icon" title="Go back to your project">
      <img
        src={PgExplorer.getExplorerIconsPath("back.png")}
        alt="Go back to your project"
        style={{ height: "0.875rem", width: "0.875rem" }}
      />
    </Button>
  );
};

export default ExplorerButtons;
