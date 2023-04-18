import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";
import { useDropzone } from "react-dropzone";

import Input from "../Input";
import { Checkmark, Upload } from "../Icons";
import { PgCommon } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";

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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: ${isDragActive ? 0.55 : 1};

    & > svg {
      ${PgThemeManager.convertToCSS(theme.components.uploadArea.icon)};
    }

    &:hover > div {
      color: ${theme.colors.default.textPrimary};
    }

    ${PgThemeManager.convertToCSS(theme.components.uploadArea.default)};
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
        <ImportResultText result="error">{error}</ImportResultText>
      </ImportResultWrapper>
    );

  if (filesLength)
    return (
      <ImportResultWrapper>
        <ImportResultText result="success">
          <Checkmark />
          Imported {filesLength} {PgCommon.makePlural("file", filesLength)}.
        </ImportResultText>
      </ImportResultWrapper>
    );

  if (isDragActive) return <ImportResultText>Drop here</ImportResultText>;

  return <ImportResultText>Select or drop files</ImportResultText>;
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
      color: inherit;
    }

    ${PgThemeManager.convertToCSS(theme.components.uploadArea.text.default)}
    ${result === "error" &&
    PgThemeManager.convertToCSS(theme.components.uploadArea.text.error)};
    ${result === "success" &&
    PgThemeManager.convertToCSS(theme.components.uploadArea.text.success)};
  `}
`;

export default UploadArea;
