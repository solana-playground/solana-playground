import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import Button from "../../../../Button";
import { useBuild } from "./";
import { TerminalAction, terminalStateAtom } from "../../../../../state";
import { useAtom } from "jotai";

const Build = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);

  const [loading, setLoading] = useState(false);

  const { runBuild } = useBuild();

  const build = useCallback(async () => {
    setLoading(true);
    await runBuild();
    setLoading(false);
  }, [setLoading, runBuild]);

  // Set global mount state
  useEffect(() => {
    setTerminalState(TerminalAction.buildMounted);
    return () => setTerminalState(TerminalAction.buildUnmounted);
  }, [setTerminalState]);

  // Run build from terminal
  useEffect(() => {
    if (terminalState.buildMounted && terminalState.buildStart) {
      setTerminalState(TerminalAction.buildStop);
      build();
    }
  }, [terminalState, build, setTerminalState]);

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={build}
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
