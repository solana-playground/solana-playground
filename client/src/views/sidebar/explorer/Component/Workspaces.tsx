import { useMemo } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Select from "../../../../components/Select";
import Text from "../../../../components/Text";
import {
  NewWorkspace,
  RenameWorkspace,
  DeleteWorkspace,
  ImportGithub,
  ImportFs,
  ImportTemporary,
  ExportWorkspace,
} from "./Modals";
import {
  Edit,
  ExportFile,
  Github,
  ImportFile,
  ImportWorkspace,
  Info,
  Plus,
  Trash,
} from "../../../../components/Icons";
import { PgCommon, PgExplorer, PgTutorial, PgView } from "../../../../utils/pg";
import { useExplorer } from "../../../../hooks";

const Workspaces = () => {
  if (PgExplorer.isTemporary) return <TemporaryWarning />;

  const handleNew = () => PgView.setModal(NewWorkspace);
  const handleRename = () => PgView.setModal(RenameWorkspace);
  const handleDelete = () => PgView.setModal(DeleteWorkspace);
  const handleGithub = () => PgView.setModal(ImportGithub);
  const handleFsImport = () => PgView.setModal(ImportFs);
  const handleFsExport = () => PgView.setModal(ExportWorkspace);

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
    const [tutorials, projects] = PgCommon.filterWithRemaining(
      PgExplorer.allWorkspaceNames!,
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
            await PgExplorer.switchWorkspace(name);
          }
        }}
      />
    </SelectWrapper>
  );
};

const Wrapper = styled.div`
  margin: 1.5rem 0.5rem 0 0.5rem;
  padding: 0 0.5rem;
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
  const handleImport = () => PgView.setModal(ImportTemporary);

  return (
    <TemporaryWarningWrapper>
      <Text icon={<Info color="info" />}>
        This is a temporary project, import it to persist changes.
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
