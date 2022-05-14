import { ChangeEvent, FC, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button, { ButtonKind } from "../Button";

interface UploadButtonProps {
  accept: string;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  showUploadText?: boolean;
  buttonKind?: ButtonKind;
  noButton?: boolean;
}

const UploadButton: FC<UploadButtonProps> = ({
  accept,
  onUpload,
  buttonKind = "outline",
  showUploadText = false,
  noButton = false,
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

  return (
    <Wrapper>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={accept}
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
