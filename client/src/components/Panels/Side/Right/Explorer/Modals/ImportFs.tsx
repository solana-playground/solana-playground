import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const disableCond = !explorer || !name || !files;

  const importNewWorkspace = async () => {
    if (disableCond) return;

    try {
      await explorer.newWorkspace(name, { files });
      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  const onDrop = useCallback(async (userFiles) => {
    try {
      const importFiles: Files = [];
      for (const userFile of userFiles) {
        const arrayBuffer = await userFile.arrayBuffer();
        const content = PgCommon.decodeArrayBuffer(arrayBuffer);
        const pathAfterRoot = userFile.path.replace(/^(\/)?\w*\//, "");
        importFiles.push([pathAfterRoot, content]);
      }

      setFiles(importFiles);
    } catch (e: any) {
      console.log(e.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

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
          <div>
            {files ? (
              <SuccessText>
                <Checkmark />
                Imported file{files.length > 1 && "s"}.
              </SuccessText>
            ) : isDragActive ? (
              "Just do it"
            ) : (
              "Select or drop files"
            )}
          </div>
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
      ${theme.colors.default.primary + (theme.transparency?.medium ?? "")};
    border-radius: ${theme.borderRadius};
    background-color: ${theme.colors.default.primary +
    (theme.transparency?.low ?? "")};
    opacity: ${isDragActive ? 0.55 : 1};
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    &:hover {
      cursor: pointer;

      & > div {
        color: ${theme.colors.default.textPrimary};
      }

      border-color: ${theme.colors.default.primary +
      (theme.transparency?.high ?? "")};
    }

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
  `}
`;

const SuccessText = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.default.secondary};

  & > svg {
    margin-right: 0.5rem;
  }
`;
