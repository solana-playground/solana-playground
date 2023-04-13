import {
  ComponentType,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFloating, shift, arrow, autoUpdate } from "@floating-ui/react-dom";
import styled, { css } from "styled-components";

import IconButton from "../IconButton";
import { SidebarIcon } from "../../utils/pg";

interface PopButtonProps {
  PopElement: ComponentType;
  buttonProps: SidebarIcon;
}

const PopButton: FC<PopButtonProps> = ({ PopElement, buttonProps }) => {
  const [isOpen, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Wrapper is for mousedown event
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const {
    x,
    y,
    reference,
    floating,
    strategy,
    refs,
    update,
    middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
  } = useFloating({
    placement: "top",
    middleware: [shift(), arrow({ element: arrowRef })],
  });

  // Update floating
  useEffect(() => {
    if (!refs.reference.current || !refs.floating.current) {
      return;
    }

    // Only call this when the floating element is rendered
    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [isOpen, refs.reference, refs.floating, update]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonWrapperRef &&
        !buttonWrapperRef.current!.contains(e.target as Node) &&
        refs.floating &&
        !refs.floating.current!.contains(e.target as Node)
      )
        close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, refs.floating, close]);

  return (
    <>
      <div ref={buttonWrapperRef}>
        <IconButton reff={reference} onClick={toggle} {...buttonProps} />
      </div>

      {isOpen && (
        <div
          ref={floating}
          style={{
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            zIndex: 2,
          }}
        >
          <PopElement />

          <div
            ref={arrowRef}
            style={{
              position: strategy,
              top: arrowY ?? "",
              left: arrowX ?? "",
            }}
          >
            <Arrow />
          </div>
        </div>
      )}
    </>
  );
};

const Arrow = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;

    &:before {
      content: "";
      position: absolute;
      border: 10px solid transparent;
      border-top-color: ${theme.colors.default.border};
    }

    &:after {
      content: "";
      position: absolute;
      border: 9px solid transparent;
      border-top-color: ${theme.components.tooltip.bg};
    }
  `}
`;

export default PopButton;
