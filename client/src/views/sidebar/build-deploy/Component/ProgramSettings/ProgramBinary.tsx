import styled from "styled-components";

import Button from "../../../../../components/Button";
import ImportButton from "../../../../../components/ImportButton";
import {
  PgCommon,
  PgExplorer,
  PgProgramInfo,
  PgServer,
} from "../../../../../utils/pg";
import { useRenderOnChange } from "../../../../../hooks";

const ProgramBinary = () => (
  <Wrapper>
    <Import />
    <Export />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

const Import = () => (
  <ImportButton
    accept=".so"
    onImport={async (ev) => {
      const files = ev.target.files;
      if (!files?.length) {
        PgProgramInfo.update({ importedProgram: null });
        return;
      }

      try {
        const file = files[0];
        const fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        PgProgramInfo.update({ importedProgram: { buffer, fileName } });
      } catch (err: any) {
        console.log(err.message);
      }
    }}
    showImportText
  >
    Import
  </ImportButton>
);

const Export = () => {
  useRenderOnChange(PgProgramInfo.onDidChangeUuid);

  if (!PgProgramInfo.uuid) return null;

  return (
    <Button
      onClick={async () => {
        const programBuffer = await PgServer.deploy(PgProgramInfo.uuid!);
        const programName = PgExplorer.currentWorkspaceName ?? "program";
        PgCommon.export(`${programName}.so`, programBuffer);
      }}
    >
      Export
    </Button>
  );
};

export default ProgramBinary;
