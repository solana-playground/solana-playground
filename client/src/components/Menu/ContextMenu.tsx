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
import type { OptionalMenuProps } from "./Menu"; // Circular dependency

export type ContextMenuProps = {} & OptionalMenuProps;

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

const ContextMenu: FC<ContextMenuProps> = ({ items, cb, children }) => {
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
        cb?.(e);
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
    [cb]
  );

  useEffect(() => {
    if (menu.state === "hide") return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (!menuWrapperRef.current?.contains(e.target as Node)) {
        hide();
      }
    };

    document.body.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menu.state, hide]);

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
