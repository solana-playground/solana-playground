import { ChangeEvent, FC, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";

interface UploadButtonProps {
  accept: string;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const DEFAULT_STATE = {
  button: "Upload",
  text: "",
};

const UploadButton: FC<UploadButtonProps> = ({ accept, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState(DEFAULT_STATE);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await onUpload(e);
    const files = e.target.files;
    if (!files?.length) setUploadState(DEFAULT_STATE);
    else setUploadState({ button: "Uploaded", text: files[0].name });
  };

  return (
    <Wrapper>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={accept}
      />
      <Button kind="outline" onClick={handleClick}>
        {uploadState.button}
      </Button>
      <UploadInfo>{uploadState.text}</UploadInfo>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;

  & input[type="file"] {
    display: none;
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
