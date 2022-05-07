import { ChangeEvent, FC, ReactNode } from "react";
import { useAtom } from "jotai";
import { Buffer } from "buffer";
import styled, { css } from "styled-components";

import UploadButton from "../../../../UploadButton";
import Foldable from "../../../../Foldable";
import { DEFAULT_PROGRAM, programAtom } from "../../../../../state";

const Extras = () => {
  return (
    <Wrapper>
      <Foldable ClickEl={<ExtraTitle>Extra options</ExtraTitle>}>
        <ExtraItem
          ButtonEl={<UploadProgram />}
          text="You can upload your program and deploy without failure."
        />
      </Foldable>
    </Wrapper>
  );
};

interface ExtraItemProps {
  text: string;
  ButtonEl: ReactNode;
}

const ExtraItem: FC<ExtraItemProps> = ({ ButtonEl, text }) => (
  <ExtraItemWrapper>
    <ExtraItemText>{text}</ExtraItemText>
    {ButtonEl}
  </ExtraItemWrapper>
);

const UploadProgram = () => {
  const [, setProgram] = useAtom(programAtom);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      setProgram(DEFAULT_PROGRAM);
      return;
    }

    try {
      const file = e.target.files[0];
      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      setProgram({ buffer, fileName });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return <UploadButton accept=".so" onUpload={handleUpload} />;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.borderColor};
`;

const ExtraTitle = styled.span``;

const ExtraItemWrapper = styled.div`
  margin-top: 1rem;

  & > div:nth-child(2) {
    margin-top: 0.75rem;
  }
`;

const ExtraItemText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font?.size.small};
  `}
`;

export default Extras;
