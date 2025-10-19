import {
  ComponentPropsWithoutRef,
  FC,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import { PgTheme } from "../../utils/pg";

interface CardProps extends ComponentPropsWithoutRef<"div"> {}

const Card: FC<CardProps> = (props) => {
  const [isClickable, setIsClickable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.onClick) return setIsClickable(true);

    if (!ref.current) return;

    const { parentElement } = ref.current;
    if (!parentElement) return;

    const isAnchorElement = parentElement.nodeName === "A";
    if (!isAnchorElement) return;

    const anchorElement = parentElement as HTMLAnchorElement;
    const hasHref = anchorElement.hasAttribute("href");
    setIsClickable(hasHref);
  }, [props.onClick]);

  const Card = <Wrapper ref={ref} {...props} />;

  if (isClickable) return <Gradient>{Card}</Gradient>;
  return Card;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    background: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    border: 1px solid
      ${theme.colors.default.border + theme.default.transparency.medium};
    border-radius: ${theme.default.borderRadius};
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    ${PgTheme.convertToCSS(theme.components.card)};
  `}
`;

const Gradient = styled.div`
  ${({ theme }) => css`
    position: relative;
    padding: 0.25rem;
    transform-style: preserve-3d;
    transition: transform ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    &::after {
      content: "";
      position: absolute;
      transform: translateZ(-1px);
      height: 100%;
      width: 100%;
      inset: 0;
      margin: auto;
      border-radius: ${theme.default.borderRadius};
      background: linear-gradient(
        45deg,
        ${theme.colors.default.primary},
        ${theme.colors.default.secondary}
      );
      opacity: 0;
      transition: opacity ${theme.default.transition.duration.medium}
        ${theme.default.transition.type};
    }

    & > div {
      overflow: hidden;
    }

    &:hover {
      cursor: pointer;
      transform: translateY(-0.5rem);

      & > div {
        background: ${theme.colors.state.hover.bg};
      }

      &::after {
        opacity: 1;
      }
    }
  `}
`;

export default Card;
