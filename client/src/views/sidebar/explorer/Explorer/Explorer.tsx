import styled from "styled-components";

import ExplorerButtons from "./ExplorerButtons";
import Folders from "./Folders";
import NoWorkspace from "./NoWorkspace";
import Workspaces from "./Workspaces";
import { useExplorerContextMenu } from "./useExplorerContextMenu";
import { useNewItem } from "./useNewItem";
import { useExplorer, useKeybind } from "../../../../hooks";

const Explorer = () => {
  const { explorer } = useExplorer();

  const { newItem } = useNewItem();
  const { renameItem, deleteItem } = useExplorerContextMenu();

  useKeybind(
    [
      { keybind: "Alt+N", handle: newItem },
      { keybind: "F2", handle: renameItem },
      { keybind: "Delete", handle: deleteItem },
    ],
    []
  );

  if (!explorer.isTemporary) {
    if (!explorer.currentWorkspaceName) return null;
    if (!explorer.hasWorkspaces()) return <NoWorkspace />;
  }

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
