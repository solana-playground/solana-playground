import styled, { css, keyframes } from "styled-components";

interface FadeInProps {}

const FadeIn = styled.div<FadeInProps>`
  ${({ theme }) => css`
    animation: ${fadeIn} ${theme.default.transition.duration.short}
      ${theme.default.transition.type} forwards;
  `}
`;

const fadeIn = keyframes`
  0% { opacity: 0 }
  100% { opacity: 1 }
`;

export default FadeIn;
