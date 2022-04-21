import { FocusEvent } from "react";
import styled, { css } from "styled-components";

import { ClassNames } from "../../constants";

interface InputProps {
  fullWidth?: boolean;
}

const Input = styled.input<InputProps>`
  ${({ theme, fullWidth }) => css`
    background-color: ${theme.colors.default.bg};
    border: 1px solid ${theme.colors.default.borderColor};
    color: ${theme.colors.default.textPrimary};
    border-radius: ${theme.borderRadius};
    padding: 0.25rem 0.5rem;
    width: ${fullWidth && "100%"};

    &:focus,
    &:focus-visible {
      outline: 1px solid
        ${theme.colors.default.primary + theme.transparency?.medium};
    }

    &:disabled {
      background-color: ${theme.colors.state.disabled.bg};
      color: ${theme.colors.state.disabled.color};
      cursor: not-allowed;
    }

    &.error {
      outline-color: transparent;
      border-color: ${theme.colors.state.error.color};
    }
  `}
`;

export const defaultInputProps = {
  autoComplete: "off",
  fullWidth: true,
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(ClassNames.TOUCHED);
  },
};

export default Input;
