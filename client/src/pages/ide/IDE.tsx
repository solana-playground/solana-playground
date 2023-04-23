import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Panels from "./Panels";
import ModalBackdrop from "../../components/Modal/ModalBackdrop";
import ClientHelper from "./ClientHelper";
import useStatics from "./useStatics";

const IDE = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.opacity = "1";
    }
  }, []);

  useStatics();

  return (
    <Wrapper ref={wrapperRef}>
      <Panels />
      <ModalBackdrop />
      <ClientHelper />
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
