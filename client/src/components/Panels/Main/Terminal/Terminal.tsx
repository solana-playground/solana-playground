import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { Resizable } from "re-resizable";

import { terminalAtom } from "../../../../state";
import TerminalText from "./TerminalText";

const Terminal = () => {
  const [terminal] = useAtom(terminalAtom);

  const terminalRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when terminal changes
  useEffect(() => {
    if (terminalRef.current)
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminal]);

  return (
    <Resizable defaultSize={{ height: 200, width: "100%" }} minWidth={"100%"}>
      <Wrapper ref={terminalRef}>
        <TerminalText text={terminal} />
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: 100%;
    padding: 1rem;
    overflow-y: auto;
    background-color: ${theme.colors.terminal?.bg ?? "inherit"};
    color: ${theme.colors.terminal?.color ?? "inherit"};
    border-top: 1px solid ${theme.colors.default.primary};
  `}
`;

export default Terminal;
