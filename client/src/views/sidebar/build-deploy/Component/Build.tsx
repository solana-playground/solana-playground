import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { useExplorer, useRenderOnChange } from "../../../../hooks";
import { PgCommand, PgGlobal } from "../../../../utils";

const Build = () => {
  const buildLoading = useRenderOnChange(PgGlobal.onDidChangeBuildLoading);

  const explorer = useExplorer();
  if (!explorer.isTemporary && !explorer.currentWorkspaceName) {
    return <Text>No project to build.</Text>;
  }

  return (
    <Wrapper>
      <Button
        kind="secondary"
        onClick={() => PgCommand.build.execute()}
        loading={buildLoading}
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
