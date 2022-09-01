import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";
import { Files, PgCommon } from "../../../../../../utils/pg";
import { Checkmark, Upload } from "../../../../../Icons";

export const ImportFs = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [name, setName] = useState("");
  const [files, setFiles] = useState<Files>();
  const [filesError, setFilesError] = useState("");
  const [importError, setImportError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setImportError("");
  };

  const onDrop = useCallback(async (userFiles) => {
    try {
      const importFiles: Files = [];
      for (const userFile of userFiles) {
        const pathAfterRoot: string = userFile.path.replace(/^(\/)?\w*\//, "");
        if (!(pathAfterRoot.endsWith(".rs") || pathAfterRoot.endsWith(".py"))) {
          throw new Error(
            `Only .rs and .py file imports are allowed.(${pathAfterRoot})`
          );
        }

        const arrayBuffer: ArrayBuffer = await userFile.arrayBuffer();
        if (arrayBuffer.byteLength > 1024 * 128) {
          throw new Error(
            `File '${pathAfterRoot}' is too big.(${arrayBuffer.byteLength})`
          );
        }

        const content = PgCommon.decodeArrayBuffer(arrayBuffer);
        importFiles.push([pathAfterRoot, content]);
      }

      setFiles(importFiles);
      setFilesError("");
    } catch (e: any) {
      setFilesError(e.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const disableCond =
    !explorer || !name || !files || !!filesError || !!importError;

  const importNewWorkspace = async () => {
    if (disableCond) return;

    try {
      await explorer.newWorkspace(name, { files });
      close();
    } catch (e: any) {
      setImportError(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{
        name: "Import",
        onSubmit: importNewWorkspace,
        disabled: disableCond,
      }}
      closeOnSubmit={false}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Project name</MainText>
          <Input
            ref={inputRef}
            onChange={handleChange}
            value={name}
            placeholder="my local project..."
            {...defaultInputProps}
          />
        </WorkspaceNameWrapper>
        <ImportFileWrapper {...getRootProps()} isDragActive={isDragActive}>
          <Input {...getInputProps()} />
          <Upload />
          <ImportResult
            error={importError || filesError}
            filesLength={files?.length}
            isDragActive={isDragActive}
          />
        </ImportFileWrapper>
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 1rem;
`;

const WorkspaceNameWrapper = styled.div`
  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const MainText = styled.div`
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
`;

const ImportFileWrapper = styled.div<{ isDragActive: boolean }>`
  ${({ theme, isDragActive }) => css`
    margin: 1.5rem 0 0.5rem 0;
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 20rem;
    border: 2px dashed
      ${theme.colors.default.primary + theme.transparency?.medium};
    border-radius: ${theme.borderRadius};
    background-color: ${theme.colors.default.primary + theme.transparency?.low};
    opacity: ${isDragActive ? 0.55 : 1};
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    & > svg {
      width: 4rem;
      height: 4rem;
      color: ${theme.colors.default.primary};
    }

    & > div {
      margin-top: 1rem;
      color: ${theme.colors.default.textSecondary};
      font-weight: bold;
    }

    &:hover {
      cursor: pointer;

      & > div {
        color: ${theme.colors.default.textPrimary};
      }

      border-color: ${theme.colors.default.primary + theme.transparency?.high};
    }
  `}
`;

interface ImportResultProps {
  error: string;
  isDragActive: boolean;
  filesLength?: number;
}

const ImportResult: FC<ImportResultProps> = ({
  error,
  filesLength,
  isDragActive,
}) => {
  if (error)
    return (
      <ImportResultWrapper>
        <ImportResultText type="Error">{error}</ImportResultText>
      </ImportResultWrapper>
    );

  if (filesLength)
    return (
      <ImportResultWrapper>
        <ImportResultText type="Success">
          <Checkmark />
          Imported file{filesLength > 1 && "s"}.
        </ImportResultText>
      </ImportResultWrapper>
    );

  if (isDragActive)
    return <ImportResultWrapper>Just do it</ImportResultWrapper>;

  return <ImportResultWrapper>Select or drop files</ImportResultWrapper>;
};

const ImportResultWrapper = styled.div``;

interface ImportResultTextProps {
  type: "Success" | "Error";
}

const ImportResultText = styled.div<ImportResultTextProps>`
  ${({ theme, type }) => css`
    display: flex;
    align-items: center;
    color: ${type === "Success"
      ? theme.colors.default.secondary
      : theme.colors.state.error.color};

    & > svg {
      margin-right: 0.5rem;
    }
  `}
`;
