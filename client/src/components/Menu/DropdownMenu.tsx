import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import MenuItem from "./MenuItem";
import { MenuWrapper } from "./MenuWrapper";
import { useOnClickOutside } from "../../hooks";
import type { CommonMenuProps } from "./Menu"; // Circular dependency

export type DropdownMenuProps = {} & CommonMenuProps;

const DropdownMenu: FC<DropdownMenuProps> = ({
  items,
  onShow,
  onHide,
  children,
}) => {
  const [show, setShow] = useState(false);

  const toggle = useCallback(() => setShow((s) => !s), []);

  useEffect(() => {
    show ? onShow?.() : onHide?.();
  }, [show, onShow, onHide]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useOnClickOutside(wrapperRef, toggle, show);

  return (
    <Wrapper ref={wrapperRef}>
      <ClickableWrapper onClick={toggle}>{children}</ClickableWrapper>

      {show && (
        <StyledMenuWrapper kind="dropdown" hide={toggle}>
          {items.map((item, i) => (
            <MenuItem key={i} {...item} hide={toggle} />
          ))}
        </StyledMenuWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const ClickableWrapper = styled.div``;

const StyledMenuWrapper = styled(MenuWrapper)`
  min-width: 100%;
`;

export default DropdownMenu;
