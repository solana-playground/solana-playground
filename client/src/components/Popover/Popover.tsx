import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";

import { Id } from "../../constants";
import { PgCommon, RequiredKey, ValueOf } from "../../utils/pg";

export interface PopoverProps {
  /** Popover element to show on trigger */
  popEl?: ReactNode;
  /** Element to anchor to */
  anchorEl?: HTMLElement;
  /** Whether to show the pop-up on hover */
  showOnHover?: boolean;
  /**
   * Whether to continue to show the pop-up when the mouse is out of the anchor
   * element but inside the pop-up element.
   */
  continueToShowOnPopupHover?: boolean;
  /** The amount of miliseconds to hover before the pop-up is visible */
  delay?: number;
  /** Max allowed with for the popover text */
  maxWidth?: number | string;
  /** Whether to use secondary background color for the popover */
  bgSecondary?: boolean;
}

const Popover: FC<PopoverProps> = ({ anchorEl, ...props }) => {
  return anchorEl ? (
    <AnchoredPopover {...props} anchorEl={anchorEl} />
  ) : (
    <ChildPopover {...props} />
  );
};

type AnchoredPopoverProps = RequiredKey<PopoverProps, "anchorEl">;

const AnchoredPopover: FC<AnchoredPopoverProps> = ({
  popEl,
  children,
  ...props
}) => <InternalPopover {...props}>{popEl}</InternalPopover>;

type ChildPopoverProps = Omit<PopoverProps, "anchorEl">;

const ChildPopover: FC<ChildPopoverProps> = ({ popEl, children, ...props }) => {
  // Requires re-render on-mount to make sure `anchorRef.current` exists
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Wrapper ref={anchorRef}>
      {children}
      {mounted && (
        <InternalPopover {...props} anchorEl={anchorRef.current!}>
          {popEl}
        </InternalPopover>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

type InternalPopoverProps = RequiredKey<PopoverProps, "anchorEl">;

const InternalPopover: FC<InternalPopoverProps> = ({
  anchorEl,
  delay = 500,
  ...props
}) => {
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
    if (!isVisible) return;

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
  }, [anchorEl, isVisible, reposition]);

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

        if (props.continueToShowOnPopupHover) {
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
        } else {
          if (
            !(
              ev.x > anchorRect.left &&
              ev.x < anchorRect.right &&
              ev.y < anchorRect.bottom &&
              ev.y > anchorRect.top
            )
          ) {
            setIsVisible(false);
          }
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
  }, [
    isVisible,
    props.showOnHover,
    props.continueToShowOnPopupHover,
    anchorEl,
  ]);

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <StyledPopover
      ref={popoverRef}
      midPoint={midPoint}
      {...position}
      {...props}
    />,
    document.getElementById(Id.PORTAL)!
  );
};

/** Popover radius in px */
const ARROW_RADIUS = 8;

interface Position {
  x: number;
  y: number;
}

const StyledPopover = styled.div<
  Pick<PopoverProps, "maxWidth" | "bgSecondary"> &
    Position & { midPoint: number }
>`
  ${({ maxWidth, bgSecondary, x, y, midPoint, theme }) => css`
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

    &::after {
      position: absolute;
      left: ${midPoint - ARROW_RADIUS}px;
      top: 100%;

      content: "";
      border: ${ARROW_RADIUS}px solid transparent;
      border-top-color: ${bgSecondary
        ? theme.components.tooltip.bgSecondary
        : theme.components.tooltip.bg};
      pointer-events: none;
    }
  `}
`;

/**
 * Get the `DOMRect` of the given element with extra padding.
 *
 * @param el element to get the rect of
 * @returns the rounded `DOMRect`
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
