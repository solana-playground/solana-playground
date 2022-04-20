import styled from "styled-components";

import Tabs from "./Tabs";
import Editor from "./Editor";
import Terminal from "./Terminal";

const Main = () => (
  <Wrapper>
    <Tabs />
    <Editor />
    <Terminal />
  </Wrapper>
);
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export default Main;
