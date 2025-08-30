import { FC, useMemo } from "react";
import styled, { css } from "styled-components";

import Checkbox from "../../../../components/Checkbox";
import Foldable from "../../../../components/Foldable";
import Select from "../../../../components/Select";
import Tooltip from "../../../../components/Tooltip";
import { useRenderOnChange } from "../../../../hooks";
import {
  PgCommon,
  PgSettings,
  PgTheme,
  PgView,
  RequiredKey,
  Setting as SettingType,
} from "../../../../utils/pg";
import { CustomSetting } from "./CustomSetting";

const Settings = () => (
  <Wrapper>
    {PgSettings.all
      .reduce((acc, cur) => {
        // TODO: Remove hardcoding `ui`
        const groupName = cur.id ? cur.id.split(".")[0] : "ui";
        const lastGroup = acc.at(-1);
        if (lastGroup?.name === groupName) lastGroup.settings.push(cur);
        else acc.push({ name: groupName, settings: [cur] });

        return acc;
      }, [] as SettingGroupProps[])
      .map((group) => {
        group.settings.sort((a, b) => {
          // Prioritize select components over checkboxes
          if (a.values && !b.values) return -1;
          if (b.values && !a.values) return 1;

          // Alphabetically order based on UI name
          return a.name.localeCompare(b.name);
        });

        return group;
      })
      .map((group) => (
        <SettingGroup key={group.name} {...group} />
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

type SettingGroupProps = {
  name: string;
  settings: SettingType[];
};

const SettingGroup: FC<SettingGroupProps> = ({ name, settings }) => (
  <SettingGroupWrapper>
    <Foldable
      isOpen
      element={PgCommon.toTitleFromCamel(name).replace("Ui", "UI")}
    >
      {settings.map((setting) => (
        <Setting key={setting.id ?? setting.name} {...setting} />
      ))}
    </Foldable>
  </SettingGroupWrapper>
);

const SettingGroupWrapper = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    max-width: calc(
      ${theme.views.sidebar.left.default.width} +
        ${theme.views.sidebar.right.default.initialWidth}
    );

    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.border};
    }
  `}
`;

const Setting: FC<SettingType> = (setting) => (
  <SettingWrapper isCheckBox={!setting.values}>
    <Left>
      <SettingName>{setting.name}</SettingName>
      {setting.description && (
        <Tooltip
          help
          bgSecondary
          element={setting.description}
          maxWidth="20rem"
        />
      )}
    </Left>

    <Right>
      {setting.onChange ? (
        <SettingSetterWithOnChange {...setting} onChange={setting.onChange} />
      ) : (
        <SettingSetter {...setting} />
      )}
    </Right>
  </SettingWrapper>
);

const SettingWrapper = styled.div<{ isCheckBox: boolean }>`
  ${({ isCheckBox }) => css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0 0.5rem 0.25rem;

    ${!isCheckBox &&
    `& > div:last-child {
      width: 11.5rem;
    }`}
  `}
`;

const Left = styled.div`
  display: flex;
  align-items: center;

  & > :nth-child(2) {
    margin-left: 0.5rem;
  }
`;

const SettingName = styled.span`
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

const Right = styled.div`
  margin-left: 1rem;
`;

type SettingSetterProps = SettingType;

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

const SettingSetterSelect: FC<SettingSetterSelectProps> = (setting) => {
  const options = useMemo(() => {
    const options = PgCommon.callIfNeeded(setting.values).map(convertValue);
    if (setting.custom) options.push({ label: "Custom", value: "" });

    return options;
  }, [setting.values, setting.custom]);

  return (
    <Select
      options={options}
      value={findOption(options, setting.getValue()) ?? options.at(-1)}
      onChange={(o) => {
        if (o?.value) {
          setting.setValue(o.value);
        } else if (setting.custom?.Component) {
          PgView.setModal(setting.custom.Component);
        } else {
          PgView.setModal(<CustomSetting setting={setting} />);
        }
      }}
    />
  );
};

/**
 * Convert the setting value to make it compatible with the `Select` component.
 *
 * @param v the value to convert
 * @returns the converted value
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
