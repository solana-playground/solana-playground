import {
  ComponentType,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFloating, shift, arrow, autoUpdate } from "@floating-ui/react-dom";
import styled from "styled-components";

import IconButton from "../IconButton";

interface PopButtonProps {
  PopElement: ComponentType;
  buttonProps?: object;
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

    const handleClickOutside = (e: any) => {
      if (
        buttonWrapperRef &&
        !buttonWrapperRef.current!.contains(e.target) &&
        refs.floating &&
        !refs.floating.current!.contains(e.target)
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
  display: flex;
  justify-content: center;

  &:before {
    content: "";
    position: absolute;
    border: 10px solid transparent;
    border-top-color: ${({ theme }) =>
      theme.colors?.left?.bg ?? theme.colors.default.borderColor};
  }

  &:after {
    content: "";
    position: absolute;
    border: 9px solid transparent;
    border-top-color: ${({ theme }) => theme.colors?.tooltip?.bg};
  }
`;

export default PopButton;
