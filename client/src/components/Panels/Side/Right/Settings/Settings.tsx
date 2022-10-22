import { FC, ReactElement } from "react";
import styled, { css } from "styled-components";

import ThemeSetting from "./ThemeSetting";
import FontSetting from "./FontSetting";
import EndpointSetting from "./EndpointSetting";
import CommitmentSetting from "./CommitmentSetting";
import PreflightSetting from "./PreflightSetting";
import ShowTxDetailsInTerminal from "./ShowTxDetailsSetting";

const Settings = () => (
  <Wrapper>
    <Setting name="Theme" SettingElement={<ThemeSetting />} />
    <Setting name="Font" SettingElement={<FontSetting />} />
    <Setting name="Endpoint" SettingElement={<EndpointSetting />} />
    <Setting name="Commitment" SettingElement={<CommitmentSetting />} />
    <Setting
      name="Preflight checks"
      SettingElement={<PreflightSetting />}
      isCheckbox
    />
    <Setting
      name="Show transaction details in terminal"
      SettingElement={<ShowTxDetailsInTerminal />}
      isCheckbox
    />
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
  isCheckbox?: boolean;
}

const Setting: FC<SettingProps> = ({ name, SettingElement, isCheckbox }) => (
  <SettingWrapper isCheckbox={isCheckbox}>
    <Left>{name}</Left>
    <Right>{SettingElement}</Right>
  </SettingWrapper>
);

const SettingWrapper = styled.div<Pick<SettingProps, "isCheckbox">>`
  ${({ theme, isCheckbox }) => css`
    display: flex;
    width: 100%;
    max-width: 23rem;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;

    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }

    & > div:last-child {
      width: ${!isCheckbox && "11.5rem"};
    }
  `}
`;

const Left = styled.div``;

const Right = styled.div`
  margin-left: 1rem;
`;

export default Settings;
