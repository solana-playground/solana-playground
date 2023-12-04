import {
  ComponentPropsWithoutRef,
  Dispatch,
  FocusEvent,
  forwardRef,
  SetStateAction,
} from "react";
import styled, { css } from "styled-components";

import { ClassName } from "../../constants";
import { PgTheme } from "../../utils/pg";

type InputError = string | boolean | null;

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  value: string;
  error?: InputError;
  setError?: Dispatch<SetStateAction<any>>;
  validator?: (value: string) => boolean | void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, setError, onChange, validator, ...props }, ref) => (
    <>
      {typeof error === "string" && error && <ErrorText>{error}</ErrorText>}
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
              if (setError) setError(err);

              if (err) ev.target.classList.add(ClassName.ERROR);
              else ev.target.classList.remove(ClassName.ERROR);
            };

            try {
              if (validator(ev.target.value) === false) {
                handleError(true);
              } else {
                handleError(null);
              }
            } catch (err: any) {
              console.log("Validation error:", err.message);
              handleError(err.message);
            }
          }
        }}
      />
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
  ${({ theme }) => css`
    &:disabled {
      background: ${theme.colors.state.disabled.bg};
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

    ${PgTheme.convertToCSS(theme.components.input)};
  `}}
`;

const defaultInputProps = {
  autoComplete: "off",
  fullWidth: true,
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(ClassName.TOUCHED);
  },
};

export default Input;
