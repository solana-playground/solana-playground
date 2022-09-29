import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import ExplorerButtons from "./ExplorerButtons";
import Folders from "./Folders";
import Workspaces from "./Workspaces";
import NoWorkspace from "./NoWorkspace";
import useExplorerContextMenu from "./useExplorerContextMenu";
import useNewItem from "./useNewItem";
import { explorerAtom } from "../../../../../state";
import { EventName } from "../../../../../constants";
import {
  useExposeMethodsAsStatic,
  useExposeGetClassAsStatic,
} from "../../../../../hooks";

const Explorer = () => {
  const [explorer] = useAtom(explorerAtom);

  useExposeGetClassAsStatic(explorer, EventName.EXPLORER_GET);
  useExposeMethodsAsStatic(explorer, EventName.EXPLORER_RUN);

  const { newItem } = useNewItem();
  const { renameItem, deleteItem } = useExplorerContextMenu();

  // Explorer keybinds
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && e.key.toUpperCase() === "N") newItem();
      else if (e.key === "F2") renameItem();
      else if (e.key === "Delete") deleteItem();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [newItem, renameItem, deleteItem]);

  if (!explorer) return null;

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
