import { FC } from "react";
import { useDropzone } from "react-dropzone";
import styled, { css } from "styled-components";

import Input from "../Input";
import { Checkmark, Upload } from "../Icons";
import { PgCommon } from "../../utils/pg";

interface UploadAreaProps {
  onDrop: (files: any) => Promise<void>;
  error: string;
  filesLength?: number;
}

const UploadArea: FC<UploadAreaProps> = ({ onDrop, error, filesLength }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  return (
    <Wrapper {...getRootProps()} isDragActive={isDragActive}>
      <Input {...getInputProps()} />
      <Upload />
      <ImportResult
        error={error}
        filesLength={filesLength}
        isDragActive={isDragActive}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ isDragActive: boolean }>`
  ${({ theme, isDragActive }) => css`
    margin: 1rem 0 0.5rem 0;
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
          Imported {filesLength} {PgCommon.makePlural("file", filesLength)}.
        </ImportResultText>
      </ImportResultWrapper>
    );

  if (isDragActive) return <ImportResultWrapper>Drop here</ImportResultWrapper>;

  return <ImportResultWrapper>Select or drop files</ImportResultWrapper>;
};

const ImportResultWrapper = styled.div``;

interface ImportResultTextProps {
  type: "Success" | "Error";
}

const ImportResultText = styled.div<ImportResultTextProps>`
  ${({ theme, type }) => css`
    --color: ${type === "Success"
      ? theme.colors.default.secondary
      : theme.colors.state.error.color};

    display: flex;
    align-items: center;

    color: var(--color);

    & > svg {
      margin-right: 0.5rem;
      color: var(--color);
    }
  `}
`;

export default UploadArea;
