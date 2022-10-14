import { FC, useCallback, useState } from "react";
import styled from "styled-components";

import ModalInside from "../../../../../../components/Modal/ModalInside";
import useModal from "../../../../../../components/Modal/useModal";
import UploadArea from "../../../../../../components/UploadArea";
import { PgCommon } from "../../../../common";

interface SugarUploadScreenProps {
  title: string;
}

export const SugarUploadScreen: FC<SugarUploadScreenProps> = ({ title }) => {
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
    >
      <Title>{title}</Title>
      <UploadWrapper>
        <UploadArea onDrop={onDrop} error={error} filesLength={files?.length} />
      </UploadWrapper>
    </ModalInside>
  );
};

const Title = styled.div`
  margin-top: 0.75rem;
  margin-bottom: -0.25rem;
  text-align: center;
  font-weight: bold;
`;

const UploadWrapper = styled.div`
  margin-bottom: 1rem;
`;
