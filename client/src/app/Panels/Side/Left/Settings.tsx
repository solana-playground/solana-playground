import { FC, useMemo } from "react";
import styled, { css } from "styled-components";

import Checkbox from "../../../../components/Checkbox";
import Select from "../../../../components/Select";
import Tooltip from "../../../../components/Tooltip";
import { useRenderOnChange } from "../../../../hooks";
import { SETTINGS, Setting as SettingType } from "../../../../settings";
import { PgCommon, PgTheme, PgView, RequiredKey } from "../../../../utils/pg";

const Settings = () => (
  <Wrapper>
    {SETTINGS.map((setting) => (
      <Setting key={setting.name} {...(setting as SettingType)} />
    ))}
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    min-width: calc(
      ${theme.views.sidebar.left.default.width} +
        ${theme.views.sidebar.right.default.initialWidth}
    );
    min-height: 10rem;
    max-height: clamp(20rem, 40rem, 80vh);
    background: ${theme.components.tooltip.bg};
    border: 1px solid ${theme.colors.default.border};
    border-radius: ${theme.default.borderRadius};
    box-shadow: ${theme.default.boxShadow};
    overflow: auto;
    ${PgTheme.getScrollbarCSS({ width: "0.25rem" })};
  `}
`;

const Setting: FC<SettingType> = ({
  name,
  tooltip,
  onChange,
  ...setterProps
}) => (
  <SettingWrapper isCheckBox={!setterProps.values}>
    <Left>
      <SettingName>{name}</SettingName>
      {tooltip && <Tooltip help bgSecondary {...tooltip} />}
    </Left>

    <Right>
      {onChange ? (
        <SettingSetterWithOnChange onChange={onChange} {...setterProps} />
      ) : (
        <SettingSetter {...setterProps} />
      )}
    </Right>
  </SettingWrapper>
);

const SettingWrapper = styled.div<{ isCheckBox: boolean }>`
  ${({ theme, isCheckBox }) => css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: calc(
      ${theme.views.sidebar.left.default.width} +
        ${theme.views.sidebar.right.default.initialWidth}
    );
    padding: 1rem;

    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.border};
    }

    ${!isCheckBox &&
    `& > div:last-child {
      width: 11.5rem;
    }`}
  `}
`;

const Left = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.default.textSecondary};
  font-weight: bold;

  & > :nth-child(2) {
    margin-left: 0.5rem;
  }
`;

const SettingName = styled.span``;

const Right = styled.div`
  margin-left: 1rem;
`;

type SettingSetterProps = Omit<SettingType, "name" | "tooltip">;

// Create a separate component to get around conditional hook usage error.
const SettingSetterWithOnChange: FC<
  RequiredKey<SettingSetterProps, "onChange">
> = ({ onChange, ...props }) => {
  useRenderOnChange(onChange);
  return <SettingSetter {...props} />;
};

const SettingSetter: FC<SettingSetterProps> = ({ values, ...props }) => {
  if (values) return <SettingSetterSelect values={values} {...props} />;
  return <SettingSetterCheckBox {...props} />;
};

type SettingSetterSelectProps = RequiredKey<SettingSetterProps, "values">;

const SettingSetterSelect: FC<SettingSetterSelectProps> = ({
  values,
  getValue,
  setValue,
  CustomComponent,
}) => {
  const options = useMemo(() => {
    const options = PgCommon.callIfNeeded(values).map(convertValue);
    if (CustomComponent) options.push({ label: "Custom", value: "" });

    return options;
  }, [values, CustomComponent]);

  return (
    <Select
      options={options}
      value={findOption(options, getValue()) ?? options.at(-1)}
      onChange={(o) => {
        if (o?.value) setValue(o.value);
        else PgView.setModal(CustomComponent);
      }}
    />
  );
};

/**
 * Convert the setting value to make it compatible with the `Select` component.
 *
 * @param v the value to convert
 */
const convertValue = (v: any) => {
  if (typeof v === "object") {
    if (v.value) return { label: v.name, value: v.value };
    if (v.values) return { label: v.name, options: v.values.map(convertValue) };
    throw new Error(`Invalid option value: ${v}`);
  }

  return { label: PgCommon.toTitleFromKebab(v), value: v };
};

/**
 * Recursively try to find the option based on the value set.
 *
 * @param opts options
 * @param v value
 * @returns the option if found
 */
const findOption = (opts: any[], v: any): any => {
  for (const opt of opts) {
    // Single options
    if (opt.value === v) return opt;

    // Groupped options
    if (opt.options) {
      const res = findOption(opt.options, v);
      if (res) return res;
    }
  }
};

type SettingSetterCheckBoxProps = Omit<SettingSetterProps, "values">;

const SettingSetterCheckBox: FC<SettingSetterCheckBoxProps> = ({
  getValue,
  setValue,
}) => {
  return (
    <Checkbox
      onChange={(ev) => setValue(ev.target.checked)}
      defaultChecked={getValue()}
    />
  );
};

export default Settings;
