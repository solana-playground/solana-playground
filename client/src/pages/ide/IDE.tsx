import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Panels from "./Panels";
import Global from "./Global";
import Helpers from "./Helpers";
import Delayed from "../../components/Delayed";

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
      <Global />
      <Delayed delay={1000}>
        <Helpers />
      </Delayed>
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
