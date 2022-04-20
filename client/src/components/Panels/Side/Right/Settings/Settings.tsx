import { FC, ReactElement } from "react";
import styled from "styled-components";

import ThemeSetting from "./ThemeSetting";
import NetworkSetting from "./NetworkSetting";

const Settings = () => (
  <Wrapper>
    <Setting name="Theme" SettingElement={<ThemeSetting />} />
    <Setting name="Endpoint" SettingElement={<NetworkSetting />} />
  </Wrapper>
);
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.colors?.tooltip?.bg};
  border: 1px solid ${({ theme }) => theme.colors.default.borderColor};
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
