import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import {
  buildCountAtom,
  explorerAtom,
  terminalAtom,
} from "../../../../../state";
import Button from "../../../../Button";
import { PgBuild, PgTerminal } from "../../../../../utils/pg";

const Build = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const [loading, setLoading] = useState(false);

  const build = useCallback(async () => {
    if (!explorer) return;

    setLoading(true);

    let msg = PgTerminal.info("Building...");

    setTerminal(msg);

    try {
      const result = await PgBuild.build(explorer.getBuildFiles());

      msg = PgTerminal.editStderr(result.stderr, result.uuid);

      // To update programId each build
      setBuildCount((c) => c + 1);
    } catch (e: any) {
      msg = `${PgTerminal.error("Build error:")} ${e.message}\n`;
    } finally {
      setTerminal(msg);
      setLoading(false);
    }
  }, [explorer, setLoading, setTerminal, setBuildCount]);

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
