import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { Keypair, PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../../../../../../components/Button";
import CopyButton from "../../../../../../../components/CopyButton";
import DownloadButton from "../../../../../../../components/DownloadButton";
import UploadButton from "../../../../../../../components/UploadButton";
import Input from "../../../../../../../components/Input";
import Modal from "../../../../../../../components/Modal";
import Text from "../../../../../../../components/Text";
import { Warning } from "../../../../../../../components/Icons";
import { refreshProgramIdAtom } from "../../../../../../../state";
import {
  PgProgramInfo,
  PgCommon,
  PgValidator,
  PgView,
} from "../../../../../../../utils/pg";

const ProgramCredentials = () => (
  <Wrapper>
    <ButtonsWrapper>
      <New />
      <Import />
      <Export />
    </ButtonsWrapper>
    <InputPk />
  </Wrapper>
);

const New = () => {
  const [, refreshProgramId] = useAtom(refreshProgramIdAtom);

  const handleNew = async () => {
    if (PgProgramInfo.state.kp) {
      await PgView.setModal(NewKeypairModal);
    } else {
      PgProgramInfo.update({ kp: Keypair.generate() });

      // Refresh necessary components
      refreshProgramId();
    }
  };

  return (
    <Button onClick={handleNew} kind="outline">
      New
    </Button>
  );
};

const NewKeypairModal = () => {
  const [, refreshProgramId] = useAtom(refreshProgramIdAtom);

  const generateNewKeypair = () => {
    PgProgramInfo.update({
      kp: Keypair.generate(),
      customPk: null,
    });

    // Refresh necessary components
    refreshProgramId();
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Generate",
        onSubmit: generateNewKeypair,
        closeOnSubmit: true,
      }}
    >
      <MainContent>
        <MainText>
          Are you sure you want to create a new program keypair?
        </MainText>
        <Desc>This will create a brand new keypair for your program.</Desc>
        <WarningTextWrapper>
          <Text kind="warning" IconEl={<Warning />}>
            The old keypair will be lost if you don't save it.
          </Text>
        </WarningTextWrapper>
        <DownloadButton
          href={PgCommon.getUtf8EncodedString(
            Array.from(PgProgramInfo.state.kp!.secretKey)
          )}
          download="program-keypair.json"
          buttonKind="outline"
        >
          Save keypair
        </DownloadButton>
      </MainContent>
    </Modal>
  );
};

const Import = () => {
  const [, refreshProgramId] = useAtom(refreshProgramIdAtom);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeBytes(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      // Override customPk when user imports a new keypair
      PgProgramInfo.update({
        kp: Keypair.fromSecretKey(buffer),
        customPk: null,
      });

      // Refresh components
      refreshProgramId();

      // Reset file
      e.target.value = "";
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <UploadButton accept=".json" onUpload={handleUpload}>
      Import
    </UploadButton>
  );
};

const Export = () => {
  useAtom(refreshProgramIdAtom); // To refresh program kp

  if (!PgProgramInfo.state.kp) return null;

  return (
    <DownloadButton
      href={PgCommon.getUtf8EncodedString(
        Array.from(PgProgramInfo.state.kp.secretKey)
      )}
      download="program-keypair.json"
    >
      Export
    </DownloadButton>
  );
};

interface UpdateInfoProps {
  text?: string;
  error?: boolean;
}

const InputPk = () => {
  const [programIdCount, refreshProgramId] = useAtom(refreshProgramIdAtom);

  const [val, setVal] = useState("");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoProps>({});
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const programPkStr = PgProgramInfo.getPkStr();
    if (programPkStr) setVal(programPkStr);
  }, [programIdCount]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
    setChanged(true);
    setUpdateInfo({});
  };

  const handleClick = () => {
    try {
      PgProgramInfo.update({ customPk: new PublicKey(val) });

      setUpdateInfo({
        text: "Updated program id.",
      });
      setChanged(false);
      refreshProgramId();
    } catch {
      setUpdateInfo({ text: "Invalid public key.", error: true });
    }
  };

  const handleRemoveCustomProgramId = () => {
    PgProgramInfo.update({ customPk: null });
    setUpdateInfo({
      text: "Removed custom id.",
    });
    refreshProgramId();
  };

  const hasCustomProgramId = useMemo(() => {
    return !!PgProgramInfo.state.customPk;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdCount]);

  return (
    <InputPkWrapper>
      <InputLabelWrapper>
        <InputLabel>Program id:</InputLabel>
        {updateInfo.text && (
          <UpdateInfo error={updateInfo?.error}>{updateInfo.text}</UpdateInfo>
        )}
      </InputLabelWrapper>

      <InputWrapper>
        <Input
          value={val}
          onChange={handleChange}
          validator={PgValidator.isPubkey}
          placeholder="Your program's public key"
        />
        <CopyButton copyText={val} />
      </InputWrapper>
      <InputWarning>
        <Warning />
        Note that you need to have this program's authority to upgrade
      </InputWarning>
      {changed && (
        <Button onClick={handleClick} kind="outline">
          Change program id
        </Button>
      )}
      {hasCustomProgramId && (
        <Button onClick={handleRemoveCustomProgramId} kind="outline">
          Remove custom program id
        </Button>
      )}
    </InputPkWrapper>
  );
};

const Wrapper = styled.div`
  & > div:first-child button {
    margin-right: 1rem;
  }
`;

const ButtonsWrapper = styled.div`
  display: flex;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem;

  & > a {
    margin-top: 1rem;
  }
`;
const MainText = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
    margin-top: 0.5rem;
  `}
`;

const WarningTextWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;

  & svg {
    height: 2rem;
    width: 2rem;
    margin-right: 1rem;
    color: ${({ theme }) => theme.colors.state.warning.color};
  }
`;

// Program Id input
const InputPkWrapper = styled.div`
  margin-top: 1rem;

  & > button {
    margin-top: 0.5rem;
  }
`;

const InputLabelWrapper = styled.div`
  margin-bottom: 0.375rem;
  font-size: ${({ theme }) => theme.font.code.size.small};
`;

const InputLabel = styled.span`
  margin-bottom: 0.375rem;
  font-size: ${({ theme }) => theme.font.code.size.small};
`;

const UpdateInfo = styled.span<UpdateInfoProps>`
  ${({ theme, error }) => css`
    margin-left: 0.375rem;
    font-size: ${theme.font.code.size.small};
    color: ${error
      ? theme.colors.state.error.color
      : theme.colors.state.success.color};
  `}
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InputWarning = styled.div`
  ${({ theme }) => css`
    margin-top: 0.375rem;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};

    & > svg {
      color: ${theme.colors.state.warning.color};
      margin-right: 0.375rem;
    }
  `}
`;

export default ProgramCredentials;
