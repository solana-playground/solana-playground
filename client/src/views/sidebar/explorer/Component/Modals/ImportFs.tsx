import { ChangeEvent, FC, useState } from "react";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import UploadArea from "../../../../../components/UploadArea";
import { ImportWorkspace, Info } from "../../../../../components/Icons";
import {
  PgExplorer,
  PgFramework,
  PgView,
  TupleFiles,
} from "../../../../../utils/pg";
import { useMounted } from "../../../../../hooks";

interface ImportFsProps {
  name?: string;
  files?: TupleFiles;
  filesError?: string;
}

export const ImportFs: FC<ImportFsProps> = (props) => {
  // Handle user input
  const [name, setName] = useState(props.name ?? "");
  const [files, setFiles] = useState(props.files);
  const [filesError, setFilesError] = useState(props.filesError ?? "");
  const [importError, setImportError] = useState("");

  const mounted = useMounted();

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
    setImportError("");
  };

  const onDrop = async (userFiles: Array<File & { path: string }>) => {
    try {
      const importFiles: TupleFiles = [];
      for (const userFile of userFiles) {
        let path = userFile.path;
        const shouldSkip = /(\/\.|node_modules|target)/.test(path);
        if (shouldSkip) continue;

        const content = await userFile.text();
        importFiles.push([path, content]);
      }

      const pgFiles = await PgFramework.convertToPlaygroundLayout(importFiles);

      // Multiple programs require selecting the program to import which closes
      // the current modal
      if (!mounted.current) {
        PgView.setModal(<ImportFs name={name} files={pgFiles} />);
      } else {
        setFiles(pgFiles);
        setFilesError("");
      }
    } catch (e: any) {
      if (!mounted.current) {
        PgView.setModal(<ImportFs name={name} filesError={e.message} />);
      } else {
        setFilesError(e.message);
      }
    }
  };

  const importFs = () => PgExplorer.newWorkspace(name, { files });

  return (
    <Modal
      title="Import project"
      buttonProps={{
        text: "Import",
        onSubmit: importFs,
        disabled: !name || !files || !!filesError,
        rightIcon: <ImportWorkspace />,
      }}
      error={importError}
      setError={setImportError}
    >
      <Content>
        <ProjectNameWrapper>
          <MainText>Project name</MainText>
          <Input
            autoFocus
            onChange={handleChange}
            value={name}
            error={importError}
            placeholder="my local project..."
          />
        </ProjectNameWrapper>

        <UploadAreaWrapper>
          <UploadArea
            onDrop={onDrop}
            error={filesError}
            filesLength={files?.length}
            text="Drop a program or a workspace"
          />
        </UploadAreaWrapper>

        <StyledText icon={<Info color="info" />}>
          You can drag & drop a Cargo workspace directory.
        </StyledText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ProjectNameWrapper = styled.div`
  margin-bottom: 0.25rem;
`;

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const UploadAreaWrapper = styled.div`
  margin-top: 1rem;
`;

const StyledText = styled(Text)`
  margin-top: 1rem;
`;
