import ReactSelect, { GroupBase, Props } from "react-select";
import styled, { css, useTheme } from "styled-components";

import { Emoji } from "../../constants";
import { PgTheme, PgView } from "../../utils";

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
      menuPortalTarget={document.getElementById(PgView.ids.PORTAL_ABOVE)}
      styles={{
        control: (base) => ({
          ...base,
          ...mapTheme(select.control),
          ":hover": mapTheme(select.control.hover),
          ":focus-within": mapTheme(select.control.focusWithin),
        }),
        menuList: (base) => ({
          ...base,
          ...PgTheme.getScrollbar({ width: "0.25rem" }),
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
              content: `"${state.isSelected ? Emoji.CHECKMARK : ""}"`,
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
    ${PgTheme.getScrollbarCss({
      allChildren: true,
      width: "0.25rem",
      height: "0.25rem",
    })};
    ${PgTheme.toCss(theme.components.select.default)};
  `}
`;

const mapTheme = (theme: any) => ({ ...theme, background: theme.bg });

// TODO: Make use of this internally to allow specifying string `value`s for
// all types of `options`
/**
 * Recursively try to find the option based on the value set.
 *
 * If not found, it will return the first option.
 *
 * @param opts options
 * @param v value
 * @param recursed whether the function has recursed
 * @returns the option if found
 */
export const findSelectOption = (
  opts: any[],
  v: unknown,
  recursed?: boolean
): any => {
  for (const opt of opts) {
    // Single options
    if (opt.value === v) return opt;

    // Groupped options
    if (opt.options) {
      const res = findSelectOption(opt.options, v, true);
      if (res) return res;
    }
  }

  if (!recursed) return opts.at(0);
};

export default Select;
