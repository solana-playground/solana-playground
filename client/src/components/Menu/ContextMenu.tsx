import {
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";

import MenuItem from "./MenuItem";
import { MenuWrapper } from "./MenuWrapper";
import { Id } from "../../constants";
import { useOnClickOutside } from "../../hooks";
import type { CommonMenuProps } from "./Menu"; // Circular dependency

export type ContextMenuProps = {
  onContextMenu?: (ev: MouseEvent<HTMLDivElement>) => void;
} & CommonMenuProps;

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
  onContextMenu,
  onShow,
  onHide,
  children,
}) => {
  const [menu, setMenu] = useState<MenuState>({
    state: "hide",
  });

  const menuWrapperRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    setMenu({ state: "hide" });
  }, []);

  const handleContextMenu = useCallback(
    (ev: MouseEvent<HTMLDivElement>) => {
      ev.preventDefault();

      try {
        onContextMenu?.(ev);
      } catch {
        return;
      }

      setMenu({
        state: "show",
        position: { x: ev.clientX, y: ev.clientY },
      });
    },
    [onContextMenu]
  );

  // Handle show or hide callbacks
  useEffect(() => {
    menu.state === "show" ? onShow?.() : onHide?.();
  }, [menu.state, onShow, onHide]);

  // Always show the menu inside the window
  useLayoutEffect(() => {
    setMenu((menu) => {
      if (menu.state !== "show") return menu;

      const rect = menuWrapperRef.current!.getBoundingClientRect();
      const extraWidth = rect.right - window.innerWidth;
      const extraHeight = rect.bottom - window.innerHeight;

      if (extraWidth > 0 || extraHeight > 0) {
        menu = structuredClone(menu);
        if (extraWidth > 0) menu.position.x -= extraWidth;
        if (extraHeight > 0) menu.position.y -= extraHeight;
      }

      return menu;
    });
  }, [menu.state]);

  // Hide on outside click when the state is `show`
  useOnClickOutside(menuWrapperRef, hide, menu.state === "show");

  return (
    <Wrapper onContextMenu={handleContextMenu}>
      {children}

      {menu.state === "show" &&
        ReactDOM.createPortal(
          <MenuWrapperWithPosition
            kind="context"
            ref={menuWrapperRef}
            hide={hide}
            {...menu.position}
          >
            {items.map((item, i) => (
              <MenuItem key={i} {...item} hide={hide} />
            ))}
          </MenuWrapperWithPosition>,
          document.getElementById(Id.PORTAL_ABOVE)!
        )}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const MenuWrapperWithPosition = styled(MenuWrapper)<Position>`
  ${({ x, y }) => css`
    top: ${y}px;
    left: ${x}px;
  `}
`;

export default ContextMenu;
