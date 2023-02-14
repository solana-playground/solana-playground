import styled from "styled-components";

import { ThreeDots } from "./ThreeDots";

export const AppLoading = () => (
  <Wrapper>
    <ThreeDots />
  </Wrapper>
);

const Wrapper = styled.div`
  position: relative;
  height: 100vh;
  width: 100vw;

  & > :first-child {
    position: absolute;
    bottom: 1rem;
    left: 2rem;
  }
`;
