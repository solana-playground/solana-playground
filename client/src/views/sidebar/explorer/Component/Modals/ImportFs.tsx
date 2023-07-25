import { ChangeEvent, useCallback, useState } from "react";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import UploadArea from "../../../../../components/UploadArea";
import {
  Lang,
  PgCommon,
  PgExplorer,
  TupleFiles,
} from "../../../../../utils/pg";

export const ImportFs = () => {
  // Handle user input
  const [name, setName] = useState("");
  const [files, setFiles] = useState<TupleFiles>();
  const [filesError, setFilesError] = useState("");
  const [importError, setImportError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
    setImportError("");
  };

  const onDrop = useCallback(async (userFiles) => {
    try {
      const importFiles: TupleFiles = [];
      for (const userFile of userFiles) {
        let path: string = userFile.path;
        switch (path.split("/").length) {
          case 1:
            path = `${PgExplorer.PATHS.SRC_DIRNAME}/${path}`;
            break;
          case 3:
            path = path.substring(1);
            break;
          default:
            path = path.replace(/\/[\w-]+\//, "");
        }

        const lang = PgExplorer.getLanguageFromPath(path);
        if (!lang) throw new Error(`Unsupported file type (${path})`);

        const arrayBuffer: ArrayBuffer = await userFile.arrayBuffer();
        if (
          (lang === Lang.RUST || lang === Lang.PYTHON) &&
          arrayBuffer.byteLength > 1024 * 128
        ) {
          throw new Error(
            `File '${path}' is too big.(${arrayBuffer.byteLength})`
          );
        }

        const content = PgCommon.decodeBytes(arrayBuffer);
        importFiles.push([path, content]);
      }

      setFiles(importFiles);
      setFilesError("");
    } catch (e: any) {
      setFilesError(e.message);
    }
  }, []);

  const importNewWorkspace = async () => {
    await PgExplorer.newWorkspace(name, { files });
  };

  return (
    <Modal
      buttonProps={{
        text: "Import",
        onSubmit: importNewWorkspace,
        disabled: !name || !files || !!filesError || !!importError,
        setError: setImportError,
      }}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Project name</MainText>
          <Input
            autoFocus
            onChange={handleChange}
            value={name}
            error={importError}
            placeholder="my local project..."
          />
        </WorkspaceNameWrapper>
        <UploadArea
          onDrop={onDrop}
          error={filesError}
          filesLength={files?.length}
        />
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WorkspaceNameWrapper = styled.div`
  margin-bottom: 0.25rem;
`;

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;
