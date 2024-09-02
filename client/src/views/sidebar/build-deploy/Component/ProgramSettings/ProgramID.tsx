import { ChangeEvent, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import CopyButton from "../../../../../components/CopyButton";
import ExportButton from "../../../../../components/ExportButton";
import ImportButton from "../../../../../components/ImportButton";
import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Warning } from "../../../../../components/Icons";
import {
  PgProgramInfo,
  PgCommon,
  PgView,
  PgWeb3,
} from "../../../../../utils/pg";
import { useRenderOnChange } from "../../../../../hooks";

const ProgramID = () => (
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
  const handleNew = async () => {
    if (PgProgramInfo.kp) {
      await PgView.setModal(NewKeypairModal);
    } else {
      PgProgramInfo.update({ kp: PgWeb3.Keypair.generate() });
    }
  };

  return <Button onClick={handleNew}>New</Button>;
};

const NewKeypairModal = () => {
  const generateNewKeypair = () => {
    PgProgramInfo.update({
      kp: PgWeb3.Keypair.generate(),
      customPk: null,
    });
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Generate",
        onSubmit: generateNewKeypair,
      }}
    >
      <MainContent>
        <MainText>
          Are you sure you want to create a new program keypair?
        </MainText>
        <Desc>This will create a brand new keypair for your program.</Desc>
        <WarningTextWrapper>
          <Text kind="warning" icon={<Warning color="warning" />}>
            The old keypair will be lost if you don't save it.
          </Text>
        </WarningTextWrapper>
        <ExportButton
          href={Array.from(PgProgramInfo.kp!.secretKey)}
          fileName="program-keypair.json"
          buttonKind="outline"
        >
          Save keypair
        </ExportButton>
      </MainContent>
    </Modal>
  );
};

const Import = () => {
  const handleImport = async (ev: ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeBytes(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      // Override customPk when user imports a new keypair
      PgProgramInfo.update({
        kp: PgWeb3.Keypair.fromSecretKey(buffer),
        customPk: null,
      });

      // Reset file
      ev.target.value = "";
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <ImportButton accept=".json" onImport={handleImport}>
      Import
    </ImportButton>
  );
};

const Export = () => {
  useRenderOnChange(PgProgramInfo.onDidChangeKp);

  if (!PgProgramInfo.kp) return null;

  return (
    <ExportButton
      href={Array.from(PgProgramInfo.kp.secretKey)}
      fileName="program-keypair.json"
    >
      Export
    </ExportButton>
  );
};

interface UpdateInfoProps {
  text?: string;
  error?: boolean;
}

const InputPk = () => {
  const [val, setVal] = useState("");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoProps>({});
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const { dispose } = PgProgramInfo.onDidChangePk((pk) => {
      if (pk) setVal(pk.toBase58());
    });

    return () => dispose();
  }, []);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setVal(ev.target.value);
    setChanged(true);
    setUpdateInfo({});
  };

  const handleClick = () => {
    try {
      PgProgramInfo.update({ customPk: new PgWeb3.PublicKey(val) });

      setUpdateInfo({ text: "Updated program id." });
      setChanged(false);
    } catch {
      setUpdateInfo({ text: "Invalid public key.", error: true });
    }
  };

  const handleRemoveCustomProgramId = () => {
    PgProgramInfo.update({ customPk: null });
    setUpdateInfo({ text: "Removed custom id." });
  };

  return (
    <InputPkWrapper>
      <InputLabelWrapper>
        <InputLabel>Program ID:</InputLabel>
        {updateInfo.text && (
          <UpdateInfo error={updateInfo?.error}>{updateInfo.text}</UpdateInfo>
        )}
      </InputLabelWrapper>

      <InputWrapper>
        <Input
          value={val}
          onChange={handleChange}
          validator={PgCommon.isPk}
          placeholder="Your program's public key"
        />
        <CopyButton copyText={val} />
      </InputWrapper>
      <InputWarning>
        <Warning color="warning" />
        Note that you need to have this program's authority to upgrade
      </InputWarning>
      {changed && <Button onClick={handleClick}>Change program id</Button>}

      {!!PgProgramInfo.customPk && (
        <Button onClick={handleRemoveCustomProgramId}>
          Remove custom program id
        </Button>
      )}
    </InputPkWrapper>
  );
};

const Wrapper = styled.div`
  & > div:first-child > * {
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
      margin-right: 0.375rem;
    }
  `}
`;

export default ProgramID;
