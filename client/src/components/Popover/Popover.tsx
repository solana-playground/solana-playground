import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";

import { Id } from "../../constants";
import { PgCommon, PgTheme, ValueOf } from "../../utils/pg";

export interface PopoverProps {
  /** Element to anchor to */
  anchorEl: HTMLElement;
  /** Whether to show the pop-up on hover */
  showOnHover?: boolean;
  /** The amount of miliseconds to hover before the pop-up is visible */
  delay?: number;
  /** Max allowed with for the popover text */
  maxWidth?: number | string;
  /** Whether to use secondary background color for the popover */
  bgSecondary?: boolean;
}

interface Position {
  x: number;
  y: number;
}

const Popover: FC<PopoverProps> = ({ anchorEl, delay = 300, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [midPoint, setMidPoint] = useState(0);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Always show the popover inside the window
  const reposition = useCallback(() => {
    if (!popoverRef.current) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    // Mid-point of the popover and the wrapped element should be the same
    const x = anchorRect.x + (anchorRect.width - popoverRect.width) / 2;

    setPosition({
      x:
        x < 0
          ? 0
          : Math.round(x + popoverRect.width) > window.innerWidth
          ? Math.round(window.innerWidth - popoverRect.width)
          : x,
      y: anchorRect.y - (popoverRect.height + ARROW_RADIUS),
    });
  }, [anchorEl]);

  // Reposition on `maxWidth` or `isVisible` change
  useLayoutEffect(() => {
    if (isVisible) reposition();
  }, [props.maxWidth, isVisible, reposition]);

  // Set popover and arrow position on resize
  useEffect(() => {
    const popoverEl = popoverRef.current;
    if (!popoverEl) return;

    const repositionResizeObserver = new ResizeObserver(reposition);
    repositionResizeObserver.observe(anchorEl);
    repositionResizeObserver.observe(popoverEl);

    const midPointResizeObserver = new ResizeObserver(() => {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverEl.getBoundingClientRect();

      if (popoverRect.x === 0) {
        const distanceToLeftEdge = anchorRect.x;
        const totalDistance = distanceToLeftEdge + anchorRect.width / 2;
        setMidPoint(totalDistance);
      } else if (Math.round(popoverRect.right) === window.innerWidth) {
        const distanceToRightEdge = window.innerWidth - anchorRect.right;
        const totalDistance = distanceToRightEdge + anchorRect.width / 2;
        setMidPoint(popoverRect.width - totalDistance);
      } else {
        setMidPoint(popoverRect.width / 2);
      }
    });
    midPointResizeObserver.observe(anchorEl);
    midPointResizeObserver.observe(popoverEl);

    return () => {
      repositionResizeObserver.unobserve(anchorEl);
      repositionResizeObserver.unobserve(popoverEl);
      midPointResizeObserver.unobserve(anchorEl);
      midPointResizeObserver.unobserve(popoverEl);
    };
  }, [anchorEl, reposition]);

  // Handle open
  useEffect(() => {
    if (props.showOnHover) {
      anchorEl.onmouseenter = (ev: MouseEvent) => {
        const el = ev.target as Element;
        if (el.contains(popoverRef.current)) return;

        const pos: Position = { x: ev.clientX, y: ev.clientY };
        const updateMousePosition = PgCommon.throttle((ev: MouseEvent) => {
          pos.x = ev.x;
          pos.y = ev.y;
        });
        document.addEventListener("mousemove", updateMousePosition);

        setTimeout(() => {
          if (anchorEl) {
            // Get the rect inside the callback because element size can change
            const anchorRect = getRoundedClientRect(anchorEl);
            if (
              pos.x > anchorRect.left &&
              pos.x < anchorRect.right &&
              pos.y < anchorRect.bottom &&
              pos.y > anchorRect.top
            ) {
              setIsVisible(true);
            }
          }

          document.removeEventListener("mousemove", updateMousePosition);
        }, delay);
      };
    } else {
      anchorEl.onmousedown = () => {
        setIsVisible(true);
      };
    }
  }, [props.showOnHover, delay, anchorEl]);

  // Handle hide
  useEffect(() => {
    if (!isVisible) return;

    if (props.showOnHover) {
      const hide = PgCommon.throttle((ev: MouseEvent) => {
        if (!popoverRef.current) return;

        // Get the rect inside the callback because element size can change
        const anchorRect = getRoundedClientRect(anchorEl);
        const popoverRect = getRoundedClientRect(popoverRef.current);

        // Pointer must be:
        // - Within the left and right side of the `anchorRect`
        // - Above the bottom of the `anchorRect`
        // - Below the top of the `popoverRect`
        if (
          ev.y > anchorRect.bottom ||
          ev.y < popoverRect.top ||
          (ev.y > anchorRect.top &&
            (ev.x < anchorRect.left || ev.x > anchorRect.right)) ||
          (ev.y < anchorRect.top &&
            (ev.x < popoverRect.left || ev.x > popoverRect.right))
        ) {
          setIsVisible(false);
        }
      });
      document.addEventListener("mousemove", hide);
      return () => document.removeEventListener("mousemove", hide);
    } else {
      // Ignore the initial open click because the initial open click also
      // triggers the `hide` callback run
      let isInitial = true;
      const hide = (ev: MouseEvent) => {
        if (isInitial) {
          isInitial = false;
          return;
        }

        const isOutside = !popoverRef.current?.contains(ev.target as Node);
        if (isOutside) setIsVisible(false);
      };
      document.addEventListener("mousedown", hide);
      return () => document.removeEventListener("mousedown", hide);
    }
  }, [isVisible, props.showOnHover, anchorEl]);

  return ReactDOM.createPortal(
    <StyledPopover
      ref={popoverRef}
      isVisible={isVisible}
      midPoint={midPoint}
      {...position}
      {...props}
    />,
    document.getElementById(Id.PORTAL)!
  );
};

/** Popover radius in px */
const ARROW_RADIUS = 8;

const StyledPopover = styled.div<
  Pick<PopoverProps, "maxWidth" | "bgSecondary"> &
    Position & { isVisible: boolean; midPoint: number }
>`
  ${({ maxWidth, bgSecondary, x, y, isVisible, midPoint, theme }) => css`
    position: absolute;
    left: ${x}px;
    top: ${y}px;

    max-width: ${!maxWidth
      ? "fit-content"
      : typeof maxWidth === "number"
      ? `${maxWidth}px`
      : maxWidth};
    width: fit-content;
    height: fit-content;

    padding: 0.375rem 0.5rem;
    border-radius: ${theme.default.borderRadius};
    font-family: ${theme.font.code.family};
    font-size: ${theme.font.code.size.small};
    text-align: center;

    opacity: ${isVisible ? 1 : 0};
    ${!isVisible && "pointer-events: none"};
    transition: opacity ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    --bg: ${bgSecondary
      ? theme.components.tooltip.bgSecondary
      : theme.components.tooltip.bg};

    &::after {
      position: absolute;
      left: ${midPoint - ARROW_RADIUS}px;
      top: 100%;

      content: "";
      border: ${ARROW_RADIUS}px solid transparent;
      border-top-color: var(--bg);
      pointer-events: none;
    }

    ${PgTheme.convertToCSS(theme.components.tooltip)};
    background: var(--bg);
  `}
`;

/**
 * Get the `DOMRect` of the given element with extra padding.
 *
 * @param el element to get the rect of
 * @returns
 */
const getRoundedClientRect = (el: HTMLElement) => {
  type RoundedRect = Omit<DOMRect, "toJSON">;
  const addPadding = (key: keyof RoundedRect, value: ValueOf<RoundedRect>) => {
    const PADDING = 1;
    switch (key) {
      case "top":
        return value - PADDING;
      case "right":
        return value + PADDING;
      case "bottom":
        return value + PADDING;
      case "left":
        return value - PADDING;
      default:
        return value;
    }
  };

  return PgCommon.entries(
    el.getBoundingClientRect().toJSON() as RoundedRect
  ).reduce((acc, [key, value]) => {
    acc[key] = Math.round(addPadding(key, value));
    return acc;
  }, {} as { -readonly [K in keyof RoundedRect]: RoundedRect[K] });
};

export default Popover;
