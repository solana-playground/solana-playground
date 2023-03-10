import ReactSelect, { GroupBase, Props } from "react-select";
import styled, { css, useTheme } from "styled-components";

const Select = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: Props<Option, IsMulti, Group>
) => {
  const theme = useTheme();
  const select = theme.components!.select!;

  return (
    // @ts-ignore
    <StyledReactSelect
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "fit-content",
          ...mapTheme(select.control),
          ":hover": mapTheme(select.control!.hover),
          ":focus-within": mapTheme(select.control!.focusWithin),
        }),
        menu: (base) => ({
          ...base,
          ...mapTheme(select.menu),
        }),
        option: (base, state) => {
          const stateStyle = state.isFocused
            ? mapTheme(select.option!.focus)
            : {};

          return {
            ...base,
            display: "flex",
            alignItems: "center",
            ...mapTheme(select.option),
            ...stateStyle,
            ":before": {
              content: `"${state.isSelected ? "✔" : ""}"`,
              width: "0.5rem",
              height: "0.5rem",
              display: "flex",
              alignItems: "center",
              marginRight: "0.5rem",
              ...mapTheme(select.option!.before),
            },
            ":active": mapTheme(select.option!.active),
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
            color: select.dropdownIndicator?.color,
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
    font-size: ${theme.font?.code?.size.small};
    width: 100%;

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.25rem;
      height: 0.25rem;
    }

    & ::-webkit-scrollbar-track {
      background-color: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const mapTheme = (theme: any) => ({ ...theme, background: theme.bg });

export default Select;
