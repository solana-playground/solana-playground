import { useEffect, useState } from "react";
import styled from "styled-components";

import ExplorerButtons from "./ExplorerButtons";
import Folders from "./Folders";
import NoWorkspace from "./NoWorkspace";
import Workspaces from "./Workspaces";
import { PgExplorer } from "../../../../utils/pg";
import { useExplorer } from "../../../../hooks";

const Explorer = () => {
  const [isReady, setIsReady] = useState(false);

  const { explorer } = useExplorer();

  useEffect(() => {
    const { dispose } = PgExplorer.onDidInit(() => {
      setIsReady(true);
    });
    return () => dispose();
  }, []);

  if (!isReady) return null;

  if (!explorer.isTemporary && !explorer.hasWorkspaces()) {
    return <NoWorkspace />;
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
