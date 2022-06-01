import { FC, ReactElement } from "react";
import styled, { css } from "styled-components";

import ThemeSetting from "./ThemeSetting";
import CommitmentSetting from "./CommitmentSetting";
import EndpointSetting from "./EndpointSetting";

const Settings = () => (
  <Wrapper>
    <Setting name="Theme" SettingElement={<ThemeSetting />} />
    <Setting name="Commitment" SettingElement={<CommitmentSetting />} />
    <Setting name="Endpoint" SettingElement={<EndpointSetting />} />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors?.tooltip?.bg};
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
  `}
`;

interface SettingProps {
  name: string;
  SettingElement: ReactElement;
}

const Setting: FC<SettingProps> = ({ name, SettingElement }) => (
  <SettingWrapper>
    <Left>{name}</Left>
    <Right>{SettingElement}</Right>
  </SettingWrapper>
);
const SettingWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 1rem;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
  }
`;

const Left = styled.div``;

const Right = styled.div`
  margin-left: 2rem;
`;

export default Settings;
