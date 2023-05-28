import { useAtom } from "jotai";
import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import { terminalStateAtom } from "../../../../../../state";
import { PgCommand } from "../../../../../../utils/pg";

const Build = () => {
  const [terminalState] = useAtom(terminalStateAtom);

  const build = useCallback(async () => await PgCommand.build.run(), []);

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={build}
        disabled={terminalState.buildLoading}
        btnLoading={terminalState.buildLoading}
        fullWidth
      >
        {terminalState.buildLoading ? "Building..." : "Build"}
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
