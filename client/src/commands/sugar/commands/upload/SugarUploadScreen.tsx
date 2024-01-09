import { FC, useCallback, useState } from "react";

import Modal from "../../../../components/Modal";
import UploadArea from "../../../../components/UploadArea";
import { PgCommon } from "../../../../utils/pg";

interface SugarUploadScreenProps {
  title: string;
}

export const SugarUploadScreen: FC<SugarUploadScreenProps> = ({ title }) => {
  const [files, setFiles] = useState<FileList>();
  const [error, setError] = useState("");

  const onDrop = useCallback(async (uploadFiles: FileList) => {
    if (uploadFiles.length % 2 === 1) {
      setError(
        `Please upload image-metadata pairs. You've selected ${
          uploadFiles.length
        } ${PgCommon.makePlural("file", uploadFiles.length)}.`
      );
    } else {
      setError("");
    }

    setFiles(uploadFiles);
  }, []);

  return (
    <Modal
      buttonProps={{
        text: "Continue",
        disabled: !files || files.length % 2 === 1,
        onSubmit: () => files,
      }}
      title={title}
    >
      <UploadArea onDrop={onDrop} error={error} filesLength={files?.length} />
    </Modal>
  );
};
