import { FC } from "react";
import styled, { css } from "styled-components";

import { Position } from "../../state/context-menu";
import useContextMenu from "./useContextMenu";

const ContextMenu: FC = ({ children }) => {
  const { menuState, menuRef } = useContextMenu();

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
    background-color: ${theme.colors?.right?.otherBg ??
    theme.colors.default.bg};
  `}
`;

export default ContextMenu;
