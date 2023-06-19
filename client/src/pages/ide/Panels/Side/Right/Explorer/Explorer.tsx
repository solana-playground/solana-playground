import { useEffect } from "react";
import styled from "styled-components";

import ExplorerButtons from "./ExplorerButtons";
import Folders from "./Folders";
import NoWorkspace from "./NoWorkspace";
import Workspaces from "./Workspaces";
import { useExplorerContextMenu } from "./useExplorerContextMenu";
import { useNewItem } from "./useNewItem";
import { useExplorer } from "../../../../../../hooks";

const Explorer = () => {
  const { explorer } = useExplorer();

  const { newItem } = useNewItem();
  const { renameItem, deleteItem } = useExplorerContextMenu();

  // Explorer keybinds
  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.altKey && ev.key.toUpperCase() === "N") newItem();
      else if (ev.key === "F2") renameItem();
      else if (ev.key === "Delete") deleteItem();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [newItem, renameItem, deleteItem]);

  if (!explorer.isShared && !explorer.hasWorkspaces()) return <NoWorkspace />;

  return (
    <ExplorerWrapper>
      <ExplorerTopWrapper>
        <Workspaces />
        <ExplorerButtons />
      </ExplorerTopWrapper>
      <Folders />
    </ExplorerWrapper>
  );
};

const ExplorerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  user-select: none;
`;

const ExplorerTopWrapper = styled.div`
  padding: 0 0.5rem;
`;

export default Explorer;
