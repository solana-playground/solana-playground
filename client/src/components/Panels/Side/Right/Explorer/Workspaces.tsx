import { ChangeEvent } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import Select from "../../../../Select";
import { explorerAtom } from "../../../../../state";

const Workspaces = () => {
  const [explorer] = useAtom(explorerAtom);

  if (!explorer?.allWorkspaceNames?.length) return null;

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    explorer.changeWorkspace(e.target.value);
  };

  const handleNew = async () => {
    await explorer.newWorkspace(
      "workspace" + explorer.allWorkspaceNames!.length
    );
  };

  const handleRename = async () => {
    await explorer.renameWorkspace(
      explorer.currentWorkspaceName!.replace("workspace", "renamed-workspace")!
    );
  };

  const handleDelete = async () => {
    await explorer.deleteWorkspace();
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
        </ButtonsWrapper>
      </TopWrapper>
      <SelectWrapper>
        <Select value={explorer.currentWorkspaceName} onChange={handleSelect}>
          {explorer.allWorkspaceNames.map((name, i) => (
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
