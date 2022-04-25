import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import {
  explorerAtom,
  programIdAtom,
  terminalAtom,
} from "../../../../../state";
import Button from "../../../../Button";
import { PgBuild } from "../../../../../utils/pg/build";
import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import { PgTerminal } from "../../../../../utils/pg/terminal";

const Build = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setProgramId] = useAtom(programIdAtom);

  const [loading, setLoading] = useState(false);

  const build = useCallback(async () => {
    setLoading(true);

    let msg = "";

    try {
      const result = await PgBuild.build(explorer);

      msg = PgTerminal.editStderr(result.stderr!, result.uuid!);

      const { programPk } = PgProgramInfo.getProgramPk();
      if (programPk) setProgramId(programPk.toBase58());
    } catch (e: any) {
      msg = `Build error: ${e.message}`;
    } finally {
      setTerminal(msg);
      setLoading(false);
    }
  }, [explorer, setTerminal, setProgramId, setLoading]);

  return (
    <Wrapper>
      <Button kind="secondary" onClick={build} disabled={loading} fullWidth>
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
