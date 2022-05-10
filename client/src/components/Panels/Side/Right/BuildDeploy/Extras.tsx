import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../Foldable";
import ProgramCredentials from "./Extras/ProgramCredentials";
import UploadProgram from "./Extras/UploadProgram";
import IDL from "./Extras/IDL";

const Extras = () => (
  <Wrapper>
    <Foldable ClickEl={<ExtraTitle>Extra</ExtraTitle>} closed>
      <ExtraItem
        title="Program credentials"
        text="Import/export program keypair or input a public key for the program."
        InsideEl={<ProgramCredentials />}
      />
      <ExtraItem
        title="Upload a program"
        text="Upload your program and deploy without failure."
        InsideEl={<UploadProgram />}
      />
      <ExtraItem
        title="IDL"
        text="Import/export the program IDL."
        InsideEl={<IDL />}
      />
    </Foldable>
  </Wrapper>
);

interface ExtraItemProps {
  title: string;
  text: string;
  InsideEl: ReactNode;
}

const ExtraItem: FC<ExtraItemProps> = ({ title, text, InsideEl }) => (
  <ExtraItemWrapper>
    <Foldable ClickEl={<ExtraItemTitle>{title}</ExtraItemTitle>} closed>
      <ExtraItemText>{text}</ExtraItemText>
      {InsideEl}
    </Foldable>
  </ExtraItemWrapper>
);

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
  margin-left: 0.5rem;

  /* Button Wrapper */
  & > div:nth-child(3) {
    margin-top: 0.75rem;
  }
`;

const ExtraItemTitle = styled.span``;

const ExtraItemText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font?.size.small};
    margin-top: 0.75rem;
  `}
`;

export default Extras;
