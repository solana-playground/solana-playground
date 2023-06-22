import { useMemo } from "react";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import Text from "../../../../../../components/Text";
import Select from "../../../../../../components/Select";
import {
  Edit,
  ExportFile,
  Github,
  ImportFile,
  ImportWorkspace,
  Info,
  Plus,
  Trash,
} from "../../../../../../components/Icons";
import {
  NewWorkspace,
  RenameWorkspace,
  DeleteWorkspace,
  ImportGithub,
  ImportFs,
  ImportTemporary,
} from "./Modals";
import { PgExplorer, PgTutorial, PgView } from "../../../../../../utils/pg";
import { useExplorer } from "../../../../../../hooks";

const Workspaces = () => {
  if (PgExplorer.isTemporary) return <TemporaryWarning />;

  const handleNew = async () => await PgView.setModal(NewWorkspace);
  const handleRename = async () => await PgView.setModal(RenameWorkspace);
  const handleDelete = async () => await PgView.setModal(DeleteWorkspace);
  const handleGithub = async () => await PgView.setModal(ImportGithub);
  const handleFsImport = async () => await PgView.setModal(ImportFs);

  const handleFsExport = async () => {
    try {
      await PgExplorer.exportWorkspace();
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
            <Edit />
          </Button>
          <Button
            onClick={handleDelete}
            kind="icon"
            hoverColor="error"
            title="Delete"
          >
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
      <WorkspaceSelect />
    </Wrapper>
  );
};

const WorkspaceSelect = () => {
  const { explorer } = useExplorer();

  const options = useMemo(() => {
    const projects = PgExplorer.allWorkspaceNames!.filter(
      (name) => !PgTutorial.isWorkspaceTutorial(name)
    );
    const tutorials = PgExplorer.allWorkspaceNames!.filter(
      PgTutorial.isWorkspaceTutorial
    );

    const projectOptions = [
      {
        label: "Projects",
        options: projects.map((name) => ({ value: name, label: name })),
      },
    ];
    if (!tutorials.length) return projectOptions;

    return projectOptions.concat([
      {
        label: "Tutorials",
        options: tutorials.map((name) => ({ value: name, label: name })),
      },
    ]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer.currentWorkspaceName]);

  const value = useMemo(() => {
    for (const option of options) {
      const val = option.options.find(
        (option) => option.value === explorer.currentWorkspaceName
      );
      if (val) return val;
    }
  }, [explorer.currentWorkspaceName, options]);

  return (
    <SelectWrapper>
      <Select
        options={options}
        value={value}
        onChange={async (props) => {
          const name = props?.value!;
          if (PgExplorer.currentWorkspaceName !== name) {
            PgExplorer.switchWorkspace(name);
          }
        }}
      />
    </SelectWrapper>
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
  ${({ theme }) => `
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.large};
  `}
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

const TemporaryWarning = () => {
  const handleImport = async () => await PgView.setModal(ImportTemporary);

  return (
    <TemporaryWarningWrapper>
      <Text IconEl={<Info color="info" />}>
        <div>This is a temporary project, import it to persist changes.</div>
      </Text>
      <Button onClick={handleImport} leftIcon={<ImportWorkspace />} fullWidth>
        Import
      </Button>
    </TemporaryWarningWrapper>
  );
};

const TemporaryWarningWrapper = styled.div`
  padding: 1rem 0.5rem;

  & > button {
    margin-top: 0.75rem;
  }
`;

export default Workspaces;
