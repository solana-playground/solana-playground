import styled, { css } from "styled-components";

import Buttons from "./Buttons";
import Folders from "./Folders";

const Explorer = () => {
  return (
    <ExplorerWrapper>
      <Buttons />
      <Folders />
    </ExplorerWrapper>
  );
};

const ExplorerWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    user-select: none;
    overflow: auto;

    & .folder,
    & .file {
      display: flex;
      padding: 0.25rem 0;
      cursor: pointer;
      border: 1px solid transparent;

      &.selected {
        background-color: ${theme.colors.default.primary +
        theme.transparency?.low};
      }

      &.ctx-selected {
        background-color: ${theme.colors.default.primary +
        theme.transparency?.medium};
        border-color: ${theme.colors.default.primary};
        border-radius: ${theme.borderRadius};
      }

      &:hover {
        background-color: ${theme.colors.default.primary +
        theme.transparency?.medium};
      }
    }
  `}
`;

export default Explorer;
