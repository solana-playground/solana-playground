import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import CreateNewWorkspace from "./CreateNewWorkspace";
import ExplorerButtons from "./ExplorerButtons";
import Folders from "./Folders";
import Workspaces from "./Workspaces";
import useExplorerContextMenu from "./useExplorerContextMenu";
import useNewItem from "./useNewItem";
import { PgEditor } from "../../../../../utils/pg";
import { explorerAtom } from "../../../../../state";

const Explorer = () => {
  const [explorer] = useAtom(explorerAtom);

  const { newItem } = useNewItem();
  const { renameItem, deleteItem } = useExplorerContextMenu();

  // Explorer keybinds
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && e.key.toUpperCase() === "N") newItem();
      else if (e.key === "F2") renameItem();
      else if (e.key === "Delete" && !PgEditor.isFocused()) {
        deleteItem();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [newItem, renameItem, deleteItem]);

  if (!explorer) return null;

  if (!explorer.hasWorkspaces()) return <CreateNewWorkspace />;

  return (
    <ExplorerWrapper>
      <Workspaces />
      <ExplorerButtons />
      <Folders />
    </ExplorerWrapper>
  );
};

const ExplorerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  user-select: none;
  padding: 0 0.5rem;
`;

export default Explorer;
