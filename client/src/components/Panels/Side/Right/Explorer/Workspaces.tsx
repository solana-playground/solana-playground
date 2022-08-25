import { ChangeEvent } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import Select from "../../../../Select";
import {
  NewWorkspace,
  RenameWorkspace,
  DeleteWorkspace,
  ImportGithub,
  ImportFs,
} from "./Modals";
import { explorerAtom, modalAtom } from "../../../../../state";

const Workspaces = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setModal] = useAtom(modalAtom);

  if (!explorer?.hasWorkspaces()) return null;

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

  return (
    <Wrapper>
      <TopWrapper>
        <MainText>Workspaces</MainText>
        <ButtonsWrapper>
          <Button onClick={handleNew} kind="outline">
            New
          </Button>
          <Button onClick={handleRename} kind="outline">
            Rename
          </Button>
          <Button onClick={handleDelete} kind="outline">
            Delete
          </Button>
          <Button onClick={handleGithub} kind="outline">
            Github
          </Button>
          <Button onClick={handleFsImport} kind="outline">
            Import
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
  align-items: center;
  margin-bottom: 0.5rem;
`;

const MainText = styled.div``;

const ButtonsWrapper = styled.div`
  margin-left: 0.5rem;
  display: flex;
  gap: 0 0.5rem;
`;

const SelectWrapper = styled.div`
  & > select {
    width: 100%;
  }
`;

export default Workspaces;
