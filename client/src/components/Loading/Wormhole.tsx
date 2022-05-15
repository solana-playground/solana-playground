import { FC } from "react";
import styled, { css, keyframes } from "styled-components";

// in rem
const DEFAULT_SIZE = 3;
const DEFAULT_CIRCLE_COUNT = 8;

interface WormholeProps {
  size?: number;
  circleCount?: number;
}

export const Wormhole: FC<WormholeProps> = ({
  size = DEFAULT_SIZE,
  circleCount = DEFAULT_CIRCLE_COUNT,
}) => {
  return (
    <Wrapper>
      <CircleWrapper size={size}>
        {Array(circleCount)
          .fill(1)
          .map((v, i) => v + i)
          .map((i) => (
            <Circle key={i} number={i} size={size} />
          ))}
      </CircleWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface CircleWrapperProps {
  size?: number;
  className?: string;
}

const CircleWrapper = styled.div<CircleWrapperProps>`
  position: relative;
  width: ${({ size }) => `${size}rem` ?? `${DEFAULT_SIZE}rem`};
  height: ${({ size }) => `${size}rem` ?? `${DEFAULT_SIZE}rem`};
`;

interface CircleProps {
  number: number;
  size: number;
  className?: string;
}

const Circle = styled.span<CircleProps>`
  ${({ size, number, theme }) => css`
    position: absolute;
    height: ${`${size * (1 - number / 10)}rem`};
    width: ${`${size * (1 - number / 10)}rem`};
    top: ${number * 0.7 * 2.5}%;
    left: ${number * 0.35 * 2.5}%;
    border: 2px solid ${theme.colors.default.primary};
    border-bottom-color: transparent;
    border-top-color: transparent;
    border-radius: 50%;
    transition: all 2s ease 0s;
    animation: 1s linear ${(number * 0.2) / 1}s infinite normal none running
      ${circleAnimation};
  `}
`;

const circleAnimation = keyframes`
  0% {transform: rotate(0deg)}
  50% {transform: rotate(180deg)}
  100% {transform: rotate(360deg)}
`;
