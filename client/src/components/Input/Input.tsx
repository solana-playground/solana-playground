import { ComponentPropsWithoutRef, FocusEvent, forwardRef } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import { ClassName } from "../../constants";

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
  const input = theme.components?.input;

  return css`
    ${fullWidth && "width: 100%"};

    background: ${input?.bg};
    color: ${input?.color};
    border: 1px solid ${input?.borderColor};
    border-radius: ${input?.borderRadius};
    padding: ${input?.padding};
    box-shadow: ${input?.boxShadow};
    outline: ${input?.outline};
    font-size: ${input?.fontSize};
    font-weight: ${input?.fontWeight};

    &:hover {
      ${input?.hover?.bg && `background: ${input.hover.bg}`};
      ${input?.hover?.color && `color: ${input.hover.color}`};
      ${input?.hover?.borderColor &&
      `border-color: ${input.hover.borderColor}`};
      ${input?.hover?.borderRadius &&
      `border-radius: ${input.hover.borderRadius}`};
      ${input?.hover?.padding && `padding: ${input.hover.padding}`};
      ${input?.hover?.boxShadow && `box-shadow: ${input.hover.boxShadow}`};
      ${input?.hover?.outline && `outline: ${input.hover.outline}`};
      ${input?.hover?.fontSize && `font-size: ${input.hover.fontSize}`};
      ${input?.hover?.fontWeight && `font-weight: ${input.hover.fontWeight}`};
    }

    &:focus,
    &:focus-visible {
      outline: ${theme.components?.input?.focus?.outline};
    }

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
