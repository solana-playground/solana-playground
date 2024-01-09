import ReactSelect, { GroupBase, Props } from "react-select";
import styled, { css, useTheme } from "styled-components";

import { PgTheme } from "../../utils/pg";

const Select = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: Props<Option, IsMulti, Group>
) => {
  const theme = useTheme();
  const select = theme.components.select;

  return (
    // @ts-ignore
    <StyledReactSelect
      styles={{
        control: (base) => ({
          ...base,
          ...mapTheme(select.control),
          ":hover": mapTheme(select.control.hover),
          ":focus-within": mapTheme(select.control.focusWithin),
        }),
        menu: (base) => ({
          ...base,
          ...mapTheme(select.menu),
        }),
        option: (base, state) => {
          const stateStyle = state.isFocused
            ? mapTheme(select.option.focus)
            : {};

          return {
            ...base,
            display: "flex",
            alignItems: "center",
            ...mapTheme(select.option),
            ...stateStyle,
            "::before": {
              content: `"${state.isSelected ? "✔" : ""}"`,
              width: "0.5rem",
              height: "0.5rem",
              display: "flex",
              alignItems: "center",
              marginRight: "0.5rem",
              ...mapTheme(select.option.before),
            },
            ":active": mapTheme(select.option.active),
          };
        },
        singleValue: (base) => ({
          ...base,
          ...mapTheme(select.singleValue),
        }),
        input: (base) => ({ ...base, ...mapTheme(select.input) }),
        groupHeading: (base) => ({
          ...base,
          ...mapTheme(select.groupHeading),
        }),
        dropdownIndicator: (base) => ({
          ...base,
          ...mapTheme(select.dropdownIndicator),
          "> svg": {
            color: select.dropdownIndicator.color,
            height: "1rem",
            width: "1rem",
          },
        }),
        indicatorSeparator: (base) => ({
          ...base,
          ...mapTheme(select.indicatorSeparator),
        }),
      }}
      {...props}
    />
  );
};

const StyledReactSelect = styled(ReactSelect)`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({
      allChildren: true,
      width: "0.25rem",
      height: "0.25rem",
    })};
    ${PgTheme.convertToCSS(theme.components.select.default)};
  `}
`;

const mapTheme = (theme: any) => ({ ...theme, background: theme.bg });

export default Select;
