import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import Button from "../../../../Button";
import useCmd from "../../../Main/Terminal/useCmd";
import { TerminalAction } from "../../../../../state";

const Build = () => {
  const [loading, setLoading] = useState(false);

  const { runBuild, terminalState, setTerminalState } = useCmd();

  const build = useCallback(async () => {
    setLoading(true);
    await runBuild();
    setLoading(false);
  }, [setLoading, runBuild]);

  useEffect(() => {
    setTerminalState(TerminalAction.buildMounted);
    return () => setTerminalState(TerminalAction.buildUnmounted);
  }, [setTerminalState]);

  // Run build from terminal
  useEffect(() => {
    if (terminalState.buildMounted && terminalState.runBuild) {
      setTerminalState(TerminalAction.notRunBuild);
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
