import {
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import MenuItem from "./MenuItem";
import { MenuWrapper } from "./MenuWrapper";
import { useOnClickOutside } from "../../hooks";
import type { OptionalMenuProps } from "./Menu"; // Circular dependency

export type ContextMenuProps = {
  beforeShowCb?: (e: MouseEvent<HTMLDivElement>) => void;
} & OptionalMenuProps;

type MenuState =
  | {
      state: "show";
      position: Position;
    }
  | {
      state: "hide";
    };

type Position = {
  x: number;
  y: number;
};

const ContextMenu: FC<ContextMenuProps> = ({
  items,
  beforeShowCb,
  onShow,
  onHide,
  children,
}) => {
  const [menu, setMenu] = useState<MenuState>({
    state: "hide",
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    setMenu({ state: "hide" });
  }, []);

  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        beforeShowCb?.(e);
      } catch {
        return;
      }

      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenu({
        state: "show",
        position: { x: e.clientX - rect.x, y: e.clientY - rect.y },
      });
    },
    [beforeShowCb]
  );

  useEffect(() => {
    menu.state === "show" ? onShow?.() : onHide?.();
  }, [menu.state, onShow, onHide]);

  // Hide on outside click when the state is `show`
  useOnClickOutside(menuWrapperRef, hide, menu.state === "show");

  return (
    <Wrapper ref={wrapperRef} onContextMenu={handleContextMenu}>
      {children}
      {menu.state === "show" && (
        <MenuWrapperWithPosition
          ref={menuWrapperRef}
          hide={hide}
          {...menu.position}
        >
          {items?.map((item, i) => (
            <MenuItem key={i} {...item} hide={hide} />
          ))}
        </MenuWrapperWithPosition>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const MenuWrapperWithPosition = styled(MenuWrapper)<Position>`
  ${({ x, y }) => css`
    position: absolute;
    top: ${y}px;
    left: ${x}px;
  `}
`;

export default ContextMenu;
