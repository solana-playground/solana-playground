import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import { terminalStateAtom } from "../../../../../../state";
import { Fn, PgTerminal } from "../../../../../../utils/pg";

const Build = () => {
  const [terminalState] = useAtom(terminalStateAtom);

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={PgTerminal.COMMANDS.build as Fn}
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
