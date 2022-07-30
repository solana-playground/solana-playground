import styled, { css, keyframes } from "styled-components";

export const skeletonAnimation = keyframes`
    100% {
        transform: translateX(100%);
    }
`;

interface SkeletonProps {
  height?: string;
  width?: string;
}

export const Skeleton = styled.div<SkeletonProps>`
  ${({ theme, height = "1rem", width = "100%" }) => css`
    background-color: ${theme.skeleton?.color};
    height: ${height};

    width: ${width};
    border-radius: ${theme.borderRadius};

    position: relative;
    overflow: hidden;
    z-index: 1;

    &::after {
      content: "";
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background-repeat: no-repeat;
      background-image: linear-gradient(
        90deg,
        ${theme.skeleton?.color},
        ${theme.skeleton?.highlightColor},
        ${theme.skeleton?.color}
      );
      transform: translateX(-100%);

      animation: ${skeletonAnimation} 1.25s ease-in-out infinite;
    }
  `}
`;
