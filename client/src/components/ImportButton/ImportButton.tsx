import { ChangeEvent, FC, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button, { ButtonKind } from "../Button";

interface ImportButtonProps {
  onImport: (ev: ChangeEvent<HTMLInputElement>) => Promise<void>;
  accept?: string;
  showImportText?: boolean;
  buttonKind?: ButtonKind;
  noButton?: boolean;
  dir?: boolean;
}

const ImportButton: FC<ImportButtonProps> = ({
  onImport,
  accept,
  buttonKind = "outline",
  showImportText,
  noButton,
  dir,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [importText, setImportText] = useState("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    await onImport(ev);
    const files = ev.target.files;
    if (!files?.length) setImportText("");
    else setImportText(files[0].name);
  };

  const dirProps = dir
    ? { webkitdirectory: "", mozdirectory: "", directory: "", multiple: true }
    : {};

  return (
    <Wrapper>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={accept}
        {...dirProps}
      />
      {noButton ? (
        <div onClick={handleClick}>{children}</div>
      ) : (
        <Button kind={buttonKind} onClick={handleClick}>
          {children}
        </Button>
      )}
      {showImportText && importText && <ImportInfo>{importText}</ImportInfo>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;

  & input[type="file"] {
    display: none;
  }

  & > div {
    width: 100%;
  }
`;

const ImportInfo = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
    margin-left: 0.5rem;
  `}
`;

export default ImportButton;
