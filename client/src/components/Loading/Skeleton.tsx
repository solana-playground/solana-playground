import styled, { css, keyframes } from "styled-components";

import { PgTheme } from "../../utils/pg";

interface SkeletonProps {
  height?: string;
  width?: string;
}

export const Skeleton = styled.div<SkeletonProps>`
  ${({ theme, height = "1rem", width = "100%" }) => {
    const skeleton = theme.components.skeleton;

    return css`
      position: relative;
      overflow: hidden;
      z-index: 1;

      height: ${height};
      width: ${width};

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
          ${skeleton.bg},
          ${skeleton.highlightColor},
          ${skeleton.bg}
        );
        transform: translateX(-100%);

        animation: ${skeletonAnimation} 1.25s ease-in-out infinite;
      }

      ${PgTheme.convertToCSS(skeleton)};
    `;
  }}
`;

const skeletonAnimation = keyframes`
    100% {
        transform: translateX(100%);
    }
`;
