import styled from "styled-components";

import { RustAnalyzer } from "./RustAnalyzer";

export const LspServers = () => (
  <Wrapper>
    <RustAnalyzer />
  </Wrapper>
);

// Right-aligned in the bottom bar, away from the wallet group
const Wrapper = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
`;
