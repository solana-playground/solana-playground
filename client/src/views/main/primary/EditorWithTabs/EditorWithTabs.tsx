import styled from "styled-components";

import { Editor } from "../../../../components/Editor";
import { Tabs } from "../../../../components/Tabs";

export const EditorWithTabs = () => (
  <Wrapper>
    <Tabs />
    <Editor />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
