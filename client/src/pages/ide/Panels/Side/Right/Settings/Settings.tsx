import { FC, ReactElement } from "react";
import styled, { css } from "styled-components";

import ThemeSetting from "./ThemeSetting";
import FontSetting from "./FontSetting";
import EndpointSetting from "./EndpointSetting";
import CommitmentSetting from "./CommitmentSetting";
import PreflightSetting from "./PreflightSetting";
import ShowTxDetailsSetting from "./ShowTxDetailsSetting";
import { HelpTooltip } from "../../../../../../components/Tooltip";

const Settings = () => (
  <Wrapper>
    <Setting name="Theme" SettingElement={<ThemeSetting />} />
    <Setting name="Font" SettingElement={<FontSetting />} />
    <Setting
      name="Endpoint"
      SettingElement={<EndpointSetting />}
      tooltip={{
        text: "RPC URL that lets you interact with a specific Solana cluster",
        maxWidth: "10rem",
      }}
    />
    <Setting
      name="Commitment"
      SettingElement={<CommitmentSetting />}
      tooltip={{
        text: "Commitment level to use when interacting with the endpoint",
        maxWidth: "12rem",
      }}
    />
    <Setting
      name="Preflight checks"
      SettingElement={<PreflightSetting />}
      isCheckbox
      tooltip={{
        text: "If enabled, this check will simulate transactions before sending them and only the transactions that pass the simulation will be sent",
        maxWidth: "18rem",
      }}
    />
    <Setting
      name="Show transaction details"
      SettingElement={<ShowTxDetailsSetting />}
      isCheckbox
      tooltip={{
        text: "Whether to automatically fetch transaction details and show them in terminal(only applies to test UI)",
        maxWidth: "18rem",
      }}
    />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    background: ${theme.components.tooltip.bg};
    border: 1px solid ${theme.colors.default.border};
    border-radius: ${theme.default.borderRadius};
    min-width: 23rem;
  `}
`;

interface SettingProps {
  name: string;
  SettingElement: ReactElement;
  isCheckbox?: boolean;
  tooltip?: {
    text: string;
    maxWidth: string;
  };
}

const Setting: FC<SettingProps> = ({
  name,
  SettingElement,
  isCheckbox,
  tooltip,
}) => (
  <SettingWrapper isCheckbox={isCheckbox}>
    <Left>
      <SettingName>{name}</SettingName>
      {tooltip && (
        <HelpTooltip
          text={tooltip.text}
          maxWidth={tooltip.maxWidth}
          bgSecondary
        />
      )}
    </Left>
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
      border-bottom: 1px solid ${theme.colors.default.border};
    }

    & > div:last-child {
      width: ${!isCheckbox && "11.5rem"};
    }
  `}
`;

const Left = styled.div`
  display: flex;

  & > :nth-child(2) {
    margin-left: 0.5rem;
  }
`;

const SettingName = styled.span``;

const Right = styled.div`
  margin-left: 1rem;
`;

export default Settings;
