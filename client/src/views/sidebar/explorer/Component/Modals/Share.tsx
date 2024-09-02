import { FC, useState } from "react";
import styled from "styled-components";

import CopyButton from "../../../../../components/CopyButton";
import FilePicker from "../../../../../components/FilePicker";
import Input from "../../../../../components/Input";
import Link from "../../../../../components/Link";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Checkmark, Sad } from "../../../../../components/Icons";
import { PgCommon, PgExplorer, PgShare, PgView } from "../../../../../utils/pg";

export const Share = () => {
  const [filePaths, setFilePaths] = useState(() =>
    Object.keys(PgExplorer.files).filter(
      (path) => PgExplorer.getItemTypeFromPath(path).file
    )
  );

  const share = async () => {
    try {
      const shareId = await PgCommon.transition(PgShare.new(filePaths));
      PgView.setModal(<SuccessPage shareId={shareId} />);
    } catch (e: any) {
      console.log("SHARE ERROR:", e.message);
      PgView.setModal(<ErrorPage message={e.message} />);
    }
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Share",
        onSubmit: share,
        disabled: !filePaths.length,
        noCloseOnSubmit: true,
      }}
    >
      <SelectFilesText>Select the files you'd like to share.</SelectFilesText>

      <FilePicker
        path={PgExplorer.getProjectRootPath()}
        filePaths={filePaths}
        setFilePaths={setFilePaths}
      />
    </Modal>
  );
};

const SelectFilesText = styled.div`
  margin-bottom: 1rem;
`;

interface ErrorPageProps {
  message: string;
}

const ErrorPage: FC<ErrorPageProps> = ({ message }) => (
  <Modal title buttonProps={{ text: "Continue" }}>
    <Text kind="error" icon={<Sad />}>
      Share error: {message}
    </Text>
  </Modal>
);

interface SuccessPageProps {
  shareId: string;
}

const SuccessPage: FC<SuccessPageProps> = ({ shareId }) => {
  const shareLink = PgCommon.getPathUrl(shareId);

  return (
    <Modal title buttonProps={{ text: "Continue" }}>
      <SuccessWrapper>
        <Text kind="success" icon={<Checkmark color="success" />}>
          Successfully shared the project.
        </Text>

        <SuccessInputWrapper>
          <Input value={shareLink} readOnly />
          <CopyButton copyText={shareLink} />
        </SuccessInputWrapper>
        <SuccessLinkWrapper>
          <Link href={shareLink}>Go to the link</Link>
        </SuccessLinkWrapper>
      </SuccessWrapper>
    </Modal>
  );
};

const SuccessWrapper = styled.div`
  min-width: 24rem;
`;

const SuccessInputWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
  align-items: center;
`;

const SuccessLinkWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
  margin-left: 0.25rem;
`;
