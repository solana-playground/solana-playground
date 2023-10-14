import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";

import { QuestionMarkOutlined } from "../Icons";
import { Id } from "../../constants";
import { PgCommon, PgTheme, ValueOf } from "../../utils/pg";

export interface TooltipProps {
  /** Tooltip element to show on hover */
  element: ReactNode;
  /** Max allowed with for the tooltip text */
  maxWidth?: number | string;
  /** Whether to use secondary background color for the tooltip */
  bgSecondary?: boolean;
}

interface Position {
  x: number;
  y: number;
}

const Tooltip: FC<TooltipProps> = ({ children, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [midPoint, setMidPoint] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Always show the tooltip inside the window
  const reposition = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Mid-point of the tooltip and the wrapped element should be the same
    const x = wrapperRect.x + (wrapperRect.width - tooltipRect.width) / 2;

    setPosition({
      x:
        x < 0
          ? 0
          : Math.round(x + tooltipRect.width) > window.innerWidth
          ? Math.round(window.innerWidth - tooltipRect.width)
          : x,
      y: wrapperRect.y - (tooltipRect.height + ARROW_RADIUS),
    });
  }, []);

  // Reposition on `maxWidth` or `isVisible` change
  useLayoutEffect(() => {
    if (isVisible) reposition();
  }, [props.maxWidth, isVisible, reposition]);

  // Set tooltip and arrow position on resize
  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    const tooltipEl = tooltipRef.current;
    if (!wrapperEl || !tooltipEl) return;

    const repositionResizeObserver = new ResizeObserver(reposition);
    repositionResizeObserver.observe(wrapperEl);
    repositionResizeObserver.observe(tooltipEl);

    const midPointResizeObserver = new ResizeObserver(() => {
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();

      if (tooltipRect.x === 0) {
        const distanceToLeftEdge = wrapperRect.x;
        const totalDistance = distanceToLeftEdge + wrapperRect.width / 2;
        setMidPoint(totalDistance);
      } else if (Math.round(tooltipRect.right) === window.innerWidth) {
        const distanceToRightEdge = window.innerWidth - wrapperRect.right;
        const totalDistance = distanceToRightEdge + wrapperRect.width / 2;
        setMidPoint(tooltipRect.width - totalDistance);
      } else {
        setMidPoint(tooltipRect.width / 2);
      }
    });
    midPointResizeObserver.observe(wrapperEl);
    midPointResizeObserver.observe(tooltipEl);

    return () => {
      repositionResizeObserver.unobserve(wrapperEl);
      repositionResizeObserver.unobserve(tooltipEl);
      midPointResizeObserver.unobserve(wrapperEl);
      midPointResizeObserver.unobserve(tooltipEl);
    };
  }, [reposition]);

  // Handle hide
  useEffect(() => {
    if (!isVisible) return;

    const getRoundedClientRect = (el: HTMLDivElement) => {
      type RoundedRect = Omit<DOMRect, "toJSON">;
      const addPadding = (
        key: keyof RoundedRect,
        value: ValueOf<RoundedRect>
      ) => {
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

    const hide = PgCommon.throttle((ev: MouseEvent) => {
      if (!wrapperRef.current || !tooltipRef.current) return;

      // Get the rect inside the callback because element size can change
      const wrapperRect = getRoundedClientRect(wrapperRef.current);
      const tooltipRect = getRoundedClientRect(tooltipRef.current);

      // Pointer must be:
      // - Within the left and right side of the `wrapperRect`
      // - Above the bottom of the `wrapperRect`
      // - Below the top of the `tooltipRect`
      if (
        ev.y > wrapperRect.bottom ||
        ev.y < tooltipRect.top ||
        (ev.y > wrapperRect.top &&
          (ev.x < wrapperRect.left || ev.x > wrapperRect.right)) ||
        (ev.y < wrapperRect.top &&
          (ev.x < tooltipRect.left || ev.x > tooltipRect.right))
      ) {
        setIsVisible(false);
      }
    });
    document.addEventListener("mousemove", hide);
    return () => document.removeEventListener("mousemove", hide);
  }, [isVisible]);

  const handleMouseEnter = useCallback(
    (ev: ReactMouseEvent<HTMLDivElement>) => {
      const el = ev.target as Element;
      if (!el.contains(tooltipRef.current)) setIsVisible(true);
    },
    []
  );

  return (
    <Wrapper ref={wrapperRef} onMouseEnter={handleMouseEnter}>
      {children}

      {ReactDOM.createPortal(
        <StyledTooltip
          ref={tooltipRef}
          isVisible={isVisible}
          midPoint={midPoint}
          {...position}
          {...props}
        >
          {props.element}
        </StyledTooltip>,
        document.getElementById(Id.PORTAL)!
      )}
    </Wrapper>
  );
};

/** Tooltip radius in px */
const ARROW_RADIUS = 8;

const Wrapper = styled.div``;

const StyledTooltip = styled.div<
  TooltipProps & Position & { isVisible: boolean; midPoint: number }
>`
  ${({ isVisible, x, y, maxWidth, midPoint, bgSecondary, theme }) => css`
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

export const HelpTooltip: FC<TooltipProps> = (props) => (
  <Tooltip {...props}>
    <StyledQuestionMarkOutlined />
  </Tooltip>
);

const StyledQuestionMarkOutlined = styled(QuestionMarkOutlined)`
  &:hover {
    cursor: help;
    color: ${({ theme }) => theme.colors.default.textPrimary};
  }
`;

export default Tooltip;
