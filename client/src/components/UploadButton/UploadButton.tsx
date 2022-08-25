import { ChangeEvent, FC, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button, { ButtonKind } from "../Button";

interface UploadButtonProps {
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  accept?: string;
  showUploadText?: boolean;
  buttonKind?: ButtonKind;
  noButton?: boolean;
  dir?: boolean;
}

const UploadButton: FC<UploadButtonProps> = ({
  onUpload,
  accept,
  buttonKind = "outline",
  showUploadText,
  noButton,
  dir,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadText, setUploadText] = useState("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await onUpload(e);
    const files = e.target.files;
    if (!files?.length) setUploadText("");
    else setUploadText(files[0].name);
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
      {showUploadText && uploadText && <UploadInfo>{uploadText}</UploadInfo>}
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

const UploadInfo = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font?.size.small};
    margin-left: 0.5rem;
  `}
`;

export default UploadButton;
