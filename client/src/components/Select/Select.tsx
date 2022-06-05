import styled, { css } from "styled-components";

const Select = styled.select`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    padding: 0.25rem 0.5rem;

    &:focus-visible {
      outline: none;
      border: 1px solid
        ${theme.colors.default.primary + theme.transparency?.medium};
    }
  `}
`;

export default Select;
