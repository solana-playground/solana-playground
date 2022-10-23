import { FC } from "react";
import styled, { css } from "styled-components";

import useContextMenu from "./useContextMenu";
import { Position } from "../../state/context-menu";

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
    z-index: 2;
  `}
`;

const InsideWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.25rem 0;
    background-color: ${theme.colors?.right?.otherBg};
    font-size: ${theme.font?.code?.size.small};
    box-shadow: ${theme.boxShadow};
  `}
`;

export default ContextMenu;
