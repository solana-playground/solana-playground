import { useCallback, useState } from "react";

import ModalInside from "../../../../../../components/Modal/ModalInside";
import useModal from "../../../../../../components/Modal/useModal";
import UploadArea from "../../../../../../components/UploadArea";
import { PgCommon } from "../../../../common";

export const UploadScreen = () => {
  const { close } = useModal();

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
    <ModalInside
      buttonProps={{
        name: "Continue",
        disabled: !files || files.length % 2 === 1,
        onSubmit: () => close(files),
      }}
      closeOnSubmit={false}
    >
      <UploadArea onDrop={onDrop} error={error} filesLength={files?.length} />
    </ModalInside>
  );
};
