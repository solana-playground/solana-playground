import { forwardRef } from "react";
import styled, { css } from "styled-components";
import {
  Resizable as ReResizable,
  ResizableProps as ReResizableProps,
  Enable,
} from "re-resizable";

type ResizableProps = Omit<ReResizableProps, "enable"> & {
  enable?: Enable | "top" | "right" | "bottom" | "left";
};

const Resizable = forwardRef<ReResizable, ResizableProps>((props, ref) => (
  <StyledResizable
    ref={ref}
    {...{
      ...props,
      enable: transformEnable(props.enable),
      onResizeStart: (ev, dir, ref) => {
        // Having a transition makes resizing experience laggy. To solve, we
        // disable the transition when resizing starts, and re-enable it
        // after resizing stops.
        ref.style.transitionDuration = "0s";
        props.onResizeStart?.(ev, dir, ref);
      },
      onResizeStop: (ev, dir, ref, delta) => {
        // Setting to empty string restores the default value
        ref.style.transitionDuration = "";
        props.onResizeStop?.(ev, dir, ref, delta);
      },
    }}
  />
));

const StyledResizable = styled(ReResizable)`
  ${({ theme }) => css`
    transition: height, width;
    transition-duration: ${theme.default.transition.duration.long};
    transition-timing-function: ${theme.default.transition.type};
  `}
`;

const transformEnable = (
  enable: ResizableProps["enable"]
): ReResizableProps["enable"] => {
  if (!enable || typeof enable === "object") return enable;

  const KEYS: Array<keyof Enable> = [
    "bottom",
    "bottomLeft",
    "bottomRight",
    "left",
    "right",
    "top",
    "topLeft",
    "topRight",
  ];
  const ALL_FALSE = Object.values(KEYS).reduce((acc, cur) => {
    acc[cur] = false;
    return acc;
  }, {} as Enable);

  switch (enable) {
    case "bottom":
      return { ...ALL_FALSE, bottom: true };
    case "left":
      return { ...ALL_FALSE, left: true };
    case "right":
      return { ...ALL_FALSE, right: true };
    case "top":
      return { ...ALL_FALSE, top: true };
  }
};

export default Resizable;
