import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Panels from "./Panels";
import ModalWrapper from "../../components/Modal/ModalWrapper";
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
      <ModalWrapper />
      <ClientHelper />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    opacity: 0;
    transition: opacity ${theme.transition?.duration.long}
      ${theme.transition?.type};
  `}
`;

export default IDE;
