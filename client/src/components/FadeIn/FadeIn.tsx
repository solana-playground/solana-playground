import styled, { css, DefaultTheme, keyframes } from "styled-components";

interface FadeInProps {
  duration?: keyof DefaultTheme["default"]["transition"]["duration"];
}

const FadeIn = styled.div<FadeInProps>`
  ${({ theme, duration = "short" }) => css`
    animation: ${fadeIn} ${theme.default.transition.duration[duration]}
      ${theme.default.transition.type} forwards;
  `}
`;

const fadeIn = keyframes`
  0% { opacity: 0 }
  100% { opacity: 1 }
`;

export default FadeIn;
