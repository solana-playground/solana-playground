import {
  ComponentPropsWithoutRef,
  Dispatch,
  FocusEvent,
  forwardRef,
  SetStateAction,
} from "react";
import styled, { css } from "styled-components";

import { ClassName } from "../../constants";
import { PgThemeManager } from "../../utils/pg/theme";

type InputError = string | boolean | null;

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: InputError;
  setError?: Dispatch<SetStateAction<InputError>>;
  validator?: (value: string) => boolean | void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, setError, onChange, validator, ...props }, ref) => (
    <>
      {error && <ErrorText>{error}</ErrorText>}
      <StyledInput
        ref={ref}
        {...defaultInputProps}
        {...props}
        className={`${className} ${error ? ClassName.ERROR : ""}`}
        onChange={(ev) => {
          onChange?.(ev);

          // Validation
          if (validator) {
            const handleError = (err: InputError) => {
              if (setError) {
                setError(err);
              } else if (err) {
                ev.target.classList.add(ClassName.ERROR);
              } else {
                ev.target.classList.remove(ClassName.ERROR);
              }
            };

            try {
              if (validator(ev.target.value) === false) {
                handleError("Invalid value");
              } else {
                handleError(null);
              }
            } catch (err: any) {
              console.log("Validation error:", err.message);
              handleError(err.message);
            }
          }
        }}
      >
        {props.children}
      </StyledInput>
    </>
  )
);

const ErrorText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.state.error.color};
    font-size: ${theme.font.code.size.small};
    margin-bottom: 0.5rem;
  `}
`;

const StyledInput = styled.input<InputProps>`
  ${({ theme }) => {
    const input = theme.components.input;

    return css`
      width: 100%;
      border: 1px solid ${input.borderColor};

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

      ${PgThemeManager.convertToCSS(input)};
    `;
  }}
`;

const defaultInputProps = {
  autoComplete: "off",
  fullWidth: true,
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(ClassName.TOUCHED);
  },
};

export default Input;
