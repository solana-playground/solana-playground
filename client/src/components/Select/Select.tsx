import styled, { css } from "styled-components";

const Select = styled.select`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bg};
    color: ${theme.colors.default.textPrimary};
    border: 1px solid ${theme.colors.default.borderColor};
    width: 100%;

    &:focus-visible {
      outline: 1px solid
        ${theme.colors.default.primary + theme.transparency?.medium};
    }
  `}
`;

export default Select;
