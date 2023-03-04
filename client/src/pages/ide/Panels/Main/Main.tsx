import styled from "styled-components";

import Terminal from "./Terminal";
import MainView from "./MainView";

const Main = () => (
  <Wrapper>
    <MainView />
    <Terminal />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export default Main;
