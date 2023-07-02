import styled, { css } from "styled-components";

interface CodeResultProps {
  index: number;
}

export const CodeResult = styled.pre<CodeResultProps>`
  ${({ theme, index }) => css`
    margin-top: 0.25rem;
    user-select: text;
    width: 100%;
    overflow-x: auto;
    padding: 0.75rem 0.5rem;
    background: ${index % 2 === 1
      ? theme.components.sidebar.right.default.otherBg
      : theme.components.sidebar.right.default.bg};
    border-radius: ${theme.default.borderRadius};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      height: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.default.borderRadius};
      background-color: ${theme.default.scrollbar.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.default.scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.default.scrollbar.thumb.color};
    }
  `}
`;
