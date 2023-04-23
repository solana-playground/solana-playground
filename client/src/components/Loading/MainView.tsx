import styled from "styled-components";

import { Wormhole } from "./Wormhole";

export const MainViewLoading = () => (
  <Wrapper>
    <Wormhole size={10} />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  height: 100%;
`;
