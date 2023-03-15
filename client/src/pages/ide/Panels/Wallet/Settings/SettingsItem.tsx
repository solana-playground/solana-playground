import styled, { css } from "styled-components";

export interface SettingsItemProps {
  close: () => void;
}

export const SettingsItem = styled.div`
  ${({ theme }) => css`
    display: flex;
    padding: 0.375rem 0.75rem;
    font-weight: bold;
    color: ${theme.colors.default.textSecondary};
    border-left: 2px solid transparent;
    transition: all ${theme.transition.duration.short} ${theme.transition.type};

    &:hover {
      background-color: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.primary};
      border-left-color: ${theme.colors.default.primary};
      cursor: pointer;
    }
  `}
`;
