import { FC } from "react";
import styled, { css, keyframes } from "styled-components";
import { ClassName } from "../../constants";

interface SpinnerWithBgProps {
  loading?: boolean;
}

export const SpinnerWithBg: FC<SpinnerWithBgProps> = ({
  loading,
  children,
}) => (
  <Background className={loading ? ClassName.LOADING : ""}>
    <Spinner className="spinner" />
    {children}
  </Background>
);

const Background = styled.div`
  position: relative;

  & > .spinner {
    display: none;
  }

  &.loading {
    & > .spinner {
      display: block;
    }

    &::after {
      content: "";
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
    }
  }
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

const spinnerAnimation = keyframes`
  0% {transform: rotate(0deg)}
  100% {transform: rotate(360deg)}
`;
