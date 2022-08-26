import { ChangeEvent } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import Text from "../../../../Text";
import Select from "../../../../Select";
import {
  NewWorkspace,
  RenameWorkspace,
  DeleteWorkspace,
  ImportGithub,
  ImportFs,
} from "./Modals";
import { explorerAtom, modalAtom } from "../../../../../state";
import {
  ExportFile,
  Github,
  ImportFile,
  Plus,
  Rename,
  Trash,
} from "../../../../Icons";

const Workspaces = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setModal] = useAtom(modalAtom);

  if (!explorer?.hasWorkspaces()) return <ShareWarning />;

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    explorer.changeWorkspace(e.target.value);
  };

  const handleNew = () => {
    setModal(<NewWorkspace />);
  };

  const handleRename = () => {
    setModal(<RenameWorkspace />);
  };

  const handleDelete = () => {
    setModal(<DeleteWorkspace />);
  };

  const handleGithub = () => {
    setModal(<ImportGithub />);
  };

  const handleFsImport = () => {
    setModal(<ImportFs />);
  };

  const handleFsExport = async () => {
    try {
      await explorer.exportWorkspace();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <Wrapper>
      <TopWrapper>
        <MainText>Projects</MainText>
        <ButtonsWrapper>
          <Button onClick={handleNew} kind="icon" title="Create">
            <Plus />
          </Button>
          <Button onClick={handleRename} kind="icon" title="Rename">
            <Rename />
          </Button>
          <Button onClick={handleDelete} kind="icon" title="Delete">
            <Trash />
          </Button>
          <Button onClick={handleGithub} kind="icon" title="Import from Github">
            <Github />
          </Button>
          <Button
            onClick={handleFsImport}
            kind="icon"
            title="Import from local file system"
          >
            <ImportFile />
          </Button>
          <Button onClick={handleFsExport} kind="icon" title="Export">
            <ExportFile />
          </Button>
        </ButtonsWrapper>
      </TopWrapper>
      <SelectWrapper>
        <Select value={explorer.currentWorkspaceName} onChange={handleSelect}>
          {explorer.allWorkspaceNames!.map((name, i) => (
            <option key={i}>{name}</option>
          ))}
        </Select>
      </SelectWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin: 1.5rem 0.5rem 0 0.5rem;
`;

const TopWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const MainText = styled.div`
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

const ButtonsWrapper = styled.div`
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0 0.5rem;
`;

const SelectWrapper = styled.div`
  & > select {
    width: 100%;
  }
`;

const ShareWarning = () => (
  <NotYourProjectWarningWrapper>
    <Text noBorder>
      <div>
        This is a shared project, the changes you make will not persist. You can
        use the <Bold>Import</Bold> button to import as a new project.
      </div>
    </Text>
  </NotYourProjectWarningWrapper>
);

const NotYourProjectWarningWrapper = styled.div`
  padding: 1rem 0.5rem;
`;

const Bold = styled.span`
  font-weight: bold;
`;

export default Workspaces;
