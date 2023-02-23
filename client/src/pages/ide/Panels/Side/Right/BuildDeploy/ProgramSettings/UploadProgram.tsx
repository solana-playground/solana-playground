import { ChangeEvent } from "react";
import { useAtom } from "jotai";

import { DEFAULT_PROGRAM, programAtom } from "../../../../../../../state";
import UploadButton from "../../../../../../../components/UploadButton";

const UploadProgram = () => {
  const [, setProgram] = useAtom(programAtom);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      setProgram(DEFAULT_PROGRAM);
      return;
    }

    try {
      const file = files[0];
      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      setProgram({ buffer, fileName });
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
