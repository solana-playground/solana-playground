import { FC, useEffect } from "react";
import styled, { css } from "styled-components";

import useContextMenu from "./useContextMenu";
import { Position } from "../../state/context-menu";
import { PgExplorer } from "../../utils/pg";

const ContextMenu: FC = ({ children }) => {
  const { menuState, menuRef, setMenuState } = useContextMenu();

  // Close context-menu on ESC
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        PgExplorer.removeCtxSelectedEl();
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [setMenuState]);

  return (
    <Wrapper ref={menuRef} x={menuState.position.x} y={menuState.position.y}>
      {menuState.show && <InsideWrapper>{children}</InsideWrapper>}
    </Wrapper>
  );
};

const Wrapper = styled.div<Position>`
  ${({ x, y }) => css`
    position: absolute;
    top: ${y}px;
    left: ${x}px;
    width: 11rem;
    z-index: 2;
  `}
`;

const InsideWrapper = styled.div`
  ${({ theme }) => css`
    border: 1px solid ${theme.colors.default.borderColor};
    background-color: ${theme.colors?.right?.otherBg};
  `}
`;

export default ContextMenu;
