import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import { useBuild } from "./";
import { TerminalAction, terminalStateAtom } from "../../../../../state";

const Build = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);

  const [loading, setLoading] = useState(false);

  const { runBuild } = useBuild();

  // Set global mount state
  useEffect(() => {
    setTerminalState(TerminalAction.buildMount);
    return () => setTerminalState(TerminalAction.buildUnmount);
  }, [setTerminalState]);

  // Run build from terminal
  useEffect(() => {
    if (terminalState.buildMounted && terminalState.buildStart) {
      runBuild();
    }
  }, [terminalState, runBuild]);

  // Loading state for if the command started when the component wasn't mounted
  useEffect(() => {
    if (terminalState.buildMounted) {
      if (terminalState.buildLoading) setLoading(true);
      else setLoading(false);
    }
  }, [terminalState, setLoading]);

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={runBuild}
        disabled={loading}
        fullWidth
        btnLoading={loading}
      >
        {loading ? "Building..." : "Build"}
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export default Build;
