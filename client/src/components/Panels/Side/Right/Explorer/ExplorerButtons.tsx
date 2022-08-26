import { FC, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Button from "../../../../Button";
import useNewItem from "./useNewItem";
import { NewItem, Share, ImportShared } from "./Modals";
import { explorerAtom, modalAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";

const ExplorerButtons = () => (
  <ExplorerButtonsWrapper>
    <NotYourProjectWarning />

    <ButtonsWrapper>
      <NewItemButton imageName="new_file.png" title="New File" />
      <NewItemButton imageName="new_folder.png" title="New Folder" />
      <NewItem />
      <CollapseAllButton />
      <ShareButton />
      <ImportButton />
      <GoBackButton />
    </ButtonsWrapper>
  </ExplorerButtonsWrapper>
);

const ExplorerButtonsWrapper = styled.div`
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
`;

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

  & button:hover {
    color: initial;
    background-color: initial;

    & img {
      filter: invert(1);
    }
  }
`;

const NotYourProjectWarningWrapper = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.font?.size.small};
  `}
`;

interface ButtonProps {
  imageName: string;
  title: string;
}

const NotYourProjectWarning = () => {
  const [explorer] = useAtom(explorerAtom);

  if (!explorer?.isShared) return null;

  return (
    <NotYourProjectWarningWrapper>
      <p>
        This is not your project, the changes you make will not persist. You can
        use the Import button to import as a new project
      </p>
    </NotYourProjectWarningWrapper>
  );
};

const NewItemButton: FC<ButtonProps> = ({ imageName, title }) => {
  const { newItem } = useNewItem();

  return (
    <Button title={title} onClick={newItem} kind="icon">
      <img src={PgExplorer.getExplorerIconsPath(imageName)} alt={title} />
    </Button>
  );
};

const CollapseAllButton = () => {
  const handleCollapse = useCallback(() => {
    PgExplorer.collapseAllFolders();
  }, []);

  return (
    <Button kind="icon" title="Collapse Folders" onClick={handleCollapse}>
      <img
        src={PgExplorer.getExplorerIconsPath("collapse.png")}
        alt="Collapse Folders"
      />
    </Button>
  );
};

const ShareButton = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setModal] = useAtom(modalAtom);

  if (!explorer) return null;

  const handleShare = () => {
    setModal(<Share />);
  };

  return (
    <Button onClick={handleShare} kind="icon" title="Share">
      <img src={PgExplorer.getExplorerIconsPath("share.png")} alt="Share" />
    </Button>
  );
};

const ImportButton = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setModal] = useAtom(modalAtom);

  if (!explorer?.isShared) return null;

  const handleImport = () => {
    setModal(<ImportShared />);
  };

  return (
    <Button onClick={handleImport} kind="icon" title="Import as new project">
      <img
        src={PgExplorer.getExplorerIconsPath("import_workspace.svg")}
        alt="Import as new project"
      />
    </Button>
  );
};

const GoBackButton = () => {
  const [explorer] = useAtom(explorerAtom);

  if (!explorer?.isShared) return null;

  return (
    <Link to="/">
      <Button kind="icon" title="Go back to your project">
        <img
          src={PgExplorer.getExplorerIconsPath("back.png")}
          alt="Go back to your project"
          style={{ height: "0.875rem", width: "0.875rem" }}
        />
      </Button>
    </Link>
  );
};

export default ExplorerButtons;
