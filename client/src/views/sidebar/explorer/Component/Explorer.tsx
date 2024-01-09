import styled from "styled-components";

import Folders from "./Folders";
import NoWorkspace from "./NoWorkspace";
import Workspaces from "./Workspaces";
import { useExplorer } from "../../../../hooks";

const Explorer = () => {
  const { explorer } = useExplorer({ checkInitialization: true });

  if (!explorer?.isTemporary) {
    if (!explorer?.allWorkspaceNames) return null;
    if (explorer.allWorkspaceNames.length === 0) return <NoWorkspace />;
  }

  return (
    <Wrapper>
      <Workspaces />
      <Folders />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  user-select: none;
`;

export default Explorer;
