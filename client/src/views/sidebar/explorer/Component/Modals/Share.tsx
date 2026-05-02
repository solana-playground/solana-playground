import { FC, useState } from "react";
import styled from "styled-components";

import Button from "../../../../../components/Button";
import FilePicker from "../../../../../components/FilePicker";
import Input from "../../../../../components/Input";
import Link from "../../../../../components/Link";
import Modal, { CommonModalPageProps } from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Checkmark, Sad } from "../../../../../components/Icons";
import { PgCommon, PgExplorer, PgRouter, PgShare } from "../../../../../utils";

export const Share = () => (
  <Modal multiple defaultPage={{ Component: Default }} />
);

type DefaultProps = CommonModalPageProps;

const Default: FC<DefaultProps> = ({ setPage }) => {
  const [filePaths, setFilePaths] = useState(() =>
    Object.keys(PgExplorer.files).filter(
      (path) => PgExplorer.getItemTypeFromPath(path).file
    )
  );

  const share = async () => {
    try {
      const shareId = await PgCommon.transition(PgShare.new(filePaths));
      setPage({ Component: SuccessPage, props: { shareId } });
    } catch (e: any) {
      setPage({ Component: ErrorPage, props: { message: e.message } });
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
  const shareLink = PgRouter.getPathUrl(shareId);

  return (
    <Modal title buttonProps={{ text: "Continue" }}>
      <SuccessWrapper>
        <Text kind="success" icon={<Checkmark color="success" />}>
          Successfully shared the project.
        </Text>

        <SuccessInputWrapper>
          <Input value={shareLink} readOnly />
          <Button.Copy copyText={shareLink} />
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
