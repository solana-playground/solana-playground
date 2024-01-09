import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";
import { DropzoneOptions, DropzoneState, useDropzone } from "react-dropzone";

import Input from "../Input";
import { Checkmark, Upload } from "../Icons";
import { PgCommon, PgTheme } from "../../utils/pg";

interface UploadAreaProps extends DropzoneOptions {
  /** Callback to run on drop or import */
  onDrop: (files: any) => Promise<void>;
  /** Error message to show */
  error: string;
  /** Default message to show */
  text?: string;
  /** The amount of files that are uploaded */
  filesLength?: number;
  className?: string;
}

const UploadArea: FC<UploadAreaProps> = ({ className, ...props }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone(props);

  return (
    <Wrapper
      className={className}
      {...getRootProps()}
      isDragActive={isDragActive}
    >
      <Input {...getInputProps()} />
      <Upload />
      <ImportResult isDragActive={isDragActive} {...props} />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ isDragActive: boolean }>`
  ${({ theme, isDragActive }) => css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: ${isDragActive ? 0.55 : 1};

    & > svg {
      ${PgTheme.convertToCSS(theme.components.uploadArea.icon)};
    }

    &:hover > div {
      color: ${theme.colors.default.textPrimary};
    }

    ${PgTheme.convertToCSS(theme.components.uploadArea.default)};
  `}
`;

type ImportResultProps = Pick<
  UploadAreaProps,
  "error" | "filesLength" | "text"
> &
  Pick<DropzoneState, "isDragActive"> &
  Pick<DropzoneOptions, "noClick">;

const ImportResult: FC<ImportResultProps> = ({
  error,
  text,
  filesLength,
  isDragActive,
  noClick,
}) => {
  if (error) {
    return (
      <ImportResultWrapper>
        <ImportResultText result="error">{error}</ImportResultText>
      </ImportResultWrapper>
    );
  }

  if (filesLength) {
    return (
      <ImportResultWrapper>
        <ImportResultText result="success">
          <Checkmark />
          Imported {filesLength} {PgCommon.makePlural("file", filesLength)}.
        </ImportResultText>
      </ImportResultWrapper>
    );
  }

  if (isDragActive) return <ImportResultText>Drop here</ImportResultText>;

  return (
    <ImportResultText>
      {text ?? (noClick ? "Drop files" : "Select or drop files")}
    </ImportResultText>
  );
};

/** Adding this div in order to only change the color when result is not defined */
const ImportResultWrapper = styled.div``;

const ImportResultText = styled.div<{
  result?: keyof DefaultTheme["components"]["uploadArea"]["text"];
}>`
  ${({ theme, result }) => css`
    display: flex;
    align-items: center;

    & > svg {
      margin-right: 0.5rem;
    }

    ${PgTheme.convertToCSS(theme.components.uploadArea.text.default)}
    ${result === "error" &&
    PgTheme.convertToCSS(theme.components.uploadArea.text.error)};
    ${result === "success" &&
    PgTheme.convertToCSS(theme.components.uploadArea.text.success)};
  `}
`;

export default UploadArea;
