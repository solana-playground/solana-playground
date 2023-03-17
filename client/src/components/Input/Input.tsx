import { ComponentPropsWithoutRef, FocusEvent, forwardRef } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import { ClassName } from "../../constants";
import { PgThemeManager } from "../../utils/pg/theme";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  fullWidth?: boolean;
  validator?: (value: string) => boolean | void;
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <StyledInput
    ref={ref}
    {...defaultInputProps}
    {...props}
    onChange={(ev) => {
      props.onChange?.(ev);

      // Validation
      if (props.validator) {
        try {
          if (props.validator(ev.target.value) === false) {
            ev.target.classList.add(ClassName.ERROR);
          } else {
            ev.target.classList.remove(ClassName.ERROR);
          }
        } catch (err: any) {
          console.log(err.message);
          ev.target.classList.add(ClassName.ERROR);
        }
      }
    }}
  >
    {props.children}
  </StyledInput>
));

const StyledInput = styled.input<InputProps>`
  ${(props) => getStyles(props)}
`;

const getStyles = ({
  fullWidth,
  theme,
}: InputProps & { theme: DefaultTheme }) => {
  const input = theme.components.input;

  return css`
    ${PgThemeManager.convertToCSS(input)};

    ${fullWidth && "width: 100%"};

    &:disabled {
      background-color: ${theme.colors.state.disabled.bg};
      color: ${theme.colors.state.disabled.color};
      cursor: not-allowed;
    }

    &.${ClassName.ERROR} {
      outline-color: transparent;
      border-color: ${theme.colors.state.error.color};
    }

    &.${ClassName.SUCCESS} {
      outline-color: transparent;
      border-color: ${theme.colors.state.success.color};
    }
  `;
};

const defaultInputProps = {
  autoComplete: "off",
  fullWidth: true,
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(ClassName.TOUCHED);
  },
};

export default Input;
