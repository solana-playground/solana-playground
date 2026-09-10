import styled from "styled-components";

import { RustAnalyzer } from "./RustAnalyzer";

/** Indicators of the language server connections, one per server */
const SERVERS = [RustAnalyzer];

export const LspServers = () => (
  <Wrapper>
    {SERVERS.map((Server, i) => (
      <Server key={i} />
    ))}
  </Wrapper>
);

// `margin-left: auto` pushes the indicators to the right edge of the bottom
// bar, away from the wallet group
const Wrapper = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
`;
