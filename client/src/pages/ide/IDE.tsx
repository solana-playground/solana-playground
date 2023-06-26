import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Panels from "./Panels";
import GlobalState from "./GlobalState";

const IDE = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.opacity = "1";
    }
  }, []);

  return (
    <Wrapper ref={wrapperRef}>
      <Panels />
      <GlobalState />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    opacity: 0;
    transition: opacity ${theme.default.transition.duration.long}
      ${theme.default.transition.type};
  `}
`;

export default IDE;
