import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import { useRenderOnChange } from "../../../../hooks";
import { PgCommand, PgGlobal } from "../../../../utils/pg";

const Build = () => {
  const buildLoading = useRenderOnChange(
    PgGlobal.onDidChangeBuildLoading,
    PgGlobal.buildLoading
  );
  const build = useCallback(() => PgCommand.build.run(), []);

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={build}
        btnLoading={buildLoading}
        fullWidth
      >
        {buildLoading ? "Building..." : "Build"}
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
