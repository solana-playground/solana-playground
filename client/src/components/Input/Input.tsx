import {
  ComponentPropsWithoutRef,
  Dispatch,
  FocusEvent,
  forwardRef,
  SetStateAction,
} from "react";
import styled, { css } from "styled-components";

import { PgTheme, PgView } from "../../utils/pg";

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
        className={`${className} ${error ? PgView.classNames.ERROR : ""}`}
        onChange={(ev) => {
          const handleError = (err: InputError) => {
            if (setError) setError(err);

            if (err) ev.target.classList.add(PgView.classNames.ERROR);
            else ev.target.classList.remove(PgView.classNames.ERROR);
          };

          // Reset error if possible
          handleError(null);

          // Validation
          if (validator) {
            try {
              if (validator(ev.target.value) === false) handleError(true);
            } catch (err: any) {
              handleError(err.message);
            }
          }

          onChange?.(ev);
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

    &.${PgView.classNames.ERROR} {
      outline-color: transparent;
      border-color: ${theme.colors.state.error.color};
    }

    &.${PgView.classNames.SUCCESS} {
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
    e.target.classList.add(PgView.classNames.TOUCHED);
  },
};

export default Input;
