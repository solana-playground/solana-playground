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

  return (
    // @ts-ignore
    <StyledReactSelect
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "fit-content",
          backgroundColor: theme.colors.input?.bg,
          borderColor: theme.colors.default.borderColor,
          borderRadius: theme.borderRadius,
          ":hover": {
            borderColor: theme.colors.state.hover.color,
          },
          ":focus-within": {
            boxShadow: `0 0 0 1px ${
              theme.colors.default.primary + theme.transparency?.high
            }`,
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: theme.colors.input?.bg,
          color: theme.colors.input?.color,
          borderRadius: theme.borderRadius,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused
            ? theme.colors.state.hover.bg
            : theme.colors.input?.bg,
          color: state.isFocused
            ? theme.colors.default.primary
            : theme.colors.default.textSecondary,
          cursor: "pointer",
          ":active": {
            backgroundColor: theme.colors.state.hover.bg,
          },
        }),
        singleValue: (base) => ({
          ...base,
          backgroundColor: theme.colors.input?.bg,
          color: theme.colors.input?.color,
        }),
        input: (base) => ({ ...base, color: theme.colors.input?.color }),
        groupHeading: (base) => ({
          ...base,
          color: theme.colors.default.textSecondary,
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: "0.25rem",
          "> svg": {
            color: theme.colors.default.textSecondary,
            height: "1rem",
            width: "1rem",
          },
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: theme.colors.default.textSecondary,
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

export default Select;
