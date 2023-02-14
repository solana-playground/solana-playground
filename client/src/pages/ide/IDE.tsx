import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Panels from "../../components/Panels";
import ModalWrapper from "../../components/Modal/ModalWrapper";
import Statics from "../../components/Statics";
import ClientHelper from "../../components/ClientHelper";

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
      <ModalWrapper />
      <Statics />
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
