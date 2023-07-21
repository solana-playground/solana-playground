import { ChangeEvent } from "react";

import ImportButton from "../../../../../components/ImportButton";
import { PgProgramInfo } from "../../../../../utils/pg";

const ProgramBinary = () => {
  const handleImport = async (ev: ChangeEvent<HTMLInputElement>) => {
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
  };

  return (
    <ImportButton accept=".so" onImport={handleImport} showImportText>
      Import
    </ImportButton>
  );
};

export default ProgramBinary;
