import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../../components/Foldable";
import ProgramCredentials from "./ProgramCredentials";
import UploadProgram from "./UploadProgram";
import IDL from "./IDL";

const ProgramSettings = () => (
  <Wrapper>
    <ProgramSetting
      title="Program credentials"
      text="Import/export program keypair or input a public key for the program."
      InsideEl={<ProgramCredentials />}
    />
    <ProgramSetting
      title="Upload a program"
      text="Upload your program and deploy without failure."
      InsideEl={<UploadProgram />}
    />
    <ProgramSetting
      title="IDL"
      text="Anchor IDL interactions."
      InsideEl={<IDL />}
    />
  </Wrapper>
);

interface ProgramSettingProps {
  title: string;
  text: string;
  InsideEl: ReactNode;
}

const ProgramSetting: FC<ProgramSettingProps> = ({ title, text, InsideEl }) => (
  <ProgramSettingWrapper>
    <Foldable ClickEl={<ProgramSettingTitle>{title}</ProgramSettingTitle>}>
      <ProgramSettingText>{text}</ProgramSettingText>
      {InsideEl}
    </Foldable>
  </ProgramSettingWrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};
`;

const ProgramSettingWrapper = styled.div`
  margin-top: 1rem;
  margin-left: 0.5rem;

  /* Button Wrapper */
  & > div:nth-child(3) {
    margin-top: 0.75rem;
  }
`;

const ProgramSettingTitle = styled.span``;

const ProgramSettingText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
    margin-top: 0.75rem;
  `}
`;

export default ProgramSettings;
