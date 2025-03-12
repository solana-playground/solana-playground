import { useCallback } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { useExplorer, useRenderOnChange } from "../../../../hooks";
import { PgCommand, PgGlobal } from "../../../../utils/pg";

const Build = () => {
  const buildLoading = useRenderOnChange(
    PgGlobal.onDidChangeBuildLoading,
    PgGlobal.buildLoading
  );
  const build = useCallback(() => PgCommand.build.execute(), []);

  const { explorer } = useExplorer();
  if (!explorer.isTemporary && !explorer.currentWorkspaceName) {
    return <Text>No project to build.</Text>;
  }

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
