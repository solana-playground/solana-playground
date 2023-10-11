import { FC } from "react";
import styled, { css, keyframes } from "styled-components";

import { ClassName } from "../../constants";
import { PgTheme } from "../../utils/pg";

interface SpinnerWithBgProps extends SpinnerProps {
  loading: boolean;
  className?: string;
}

export const SpinnerWithBg: FC<SpinnerWithBgProps> = ({
  loading,
  className,
  children,
  ...spinnerProps
}) => (
  <Wrapper className={`${className ?? ""} ${loading ? ClassName.LOADING : ""}`}>
    <Spinner className="spinner" {...spinnerProps} />
    {children}
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 100%;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: #00000000;
      z-index: -1;
      transition: all ${theme.default.transition.duration.medium}
        ${theme.default.transition.type};
    }

    & > .spinner {
      display: none;
    }

    &.${ClassName.LOADING} {
      &::after {
        z-index: 1;
        ${PgTheme.convertToCSS(theme.default.backdrop)};
      }

      & > .spinner {
        display: block;
        position: absolute;
        inset: 0;
        margin: auto;
        z-index: 2;
      }
    }
  `}
`;

interface SpinnerProps {
  size?: string;
}

export const Spinner = styled.div<SpinnerProps>`
  ${({ size = "1rem", theme }) => css`
    &::after {
      content: "";
      width: ${size};
      height: ${size};
      border: 4px solid transparent;
      border-top-color: ${theme.colors.default.primary};
      border-right-color: ${theme.colors.default.primary};
      position: absolute;
      inset: 0;
      margin: auto;
      border-radius: 50%;
      animation: ${spinnerAnimation} 0.5s linear infinite;
    }
  `}
`;

export const spinnerAnimation = keyframes`
  0% {transform: rotate(0deg)}
  100% {transform: rotate(360deg)}
`;
