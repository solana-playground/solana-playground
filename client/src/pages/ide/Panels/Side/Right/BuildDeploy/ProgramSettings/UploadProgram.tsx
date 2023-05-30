import { ChangeEvent } from "react";

import UploadButton from "../../../../../../../components/UploadButton";
import { PgProgramInfo } from "../../../../../../../utils/pg";

const UploadProgram = () => {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      PgProgramInfo.update({ uploadedProgram: null });
      return;
    }

    try {
      const file = files[0];
      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      PgProgramInfo.update({ uploadedProgram: { buffer, fileName } });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <UploadButton accept=".so" onUpload={handleUpload} showUploadText>
      Upload
    </UploadButton>
  );
};

export default UploadProgram;
