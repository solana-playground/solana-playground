import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Keypair, PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../../../../Button";
import CopyButton from "../../../../../CopyButton";
import DownloadButton from "../../../../../DownloadButton";
import UploadButton from "../../../../../UploadButton";
import Input from "../../../../../Input";
import ModalInside from "../../../../../Modal/ModalInside";
import Text from "../../../../../Text";
import { ClassName } from "../../../../../../constants";
import { Warning } from "../../../../../Icons";
import { modalAtom, refreshProgramIdAtom } from "../../../../../../state";
import { PgProgramInfo, PgCommon } from "../../../../../../utils/pg";

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
  const [, setModal] = useAtom(modalAtom);
  const [, refreshProgramId] = useAtom(refreshProgramIdAtom);

  const handleNew = () => {
    const kp = PgProgramInfo.getKp()?.programKp;
    if (kp) setModal(<NewKeypairModal />);
    else {
      PgProgramInfo.createNewKp();

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
    const kp = Keypair.generate();

    PgProgramInfo.update({
      kp: Array.from(kp.secretKey),
      customPk: null,
    });

    // Refresh necessary components
    refreshProgramId();
  };

  return (
    <ModalInside
      title
      buttonProps={{
        name: "Generate",
        onSubmit: generateNewKeypair,
      }}
    >
      <Content>
        <MainContent>
          <MainText>
            Are you sure you want to create a new program keypair?
          </MainText>
          <Desc>This will create a brand new keypair for your program.</Desc>
          <WarningTextWrapper>
            <Text type="Warning">
              <Warning />
              The old keypair will be lost if you don't save it.
            </Text>
          </WarningTextWrapper>
          <DownloadButton
            href={PgCommon.getUtf8EncodedString(
              Array.from(PgProgramInfo.getKp()?.programKp!.secretKey)
            )}
            download="program-keypair.json"
            buttonKind="outline"
          >
            Save keypair
          </DownloadButton>
        </MainContent>
      </Content>
    </ModalInside>
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
      const decodedString = PgCommon.decodeArrayBuffer(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      // Override customPk when user imports a new keypair
      PgProgramInfo.update({
        kp: Array.from(buffer),
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

  const programKp = PgProgramInfo.getKp()?.programKp;

  if (!programKp) return null;

  return (
    <DownloadButton
      href={PgCommon.getUtf8EncodedString(Array.from(programKp.secretKey))}
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

  const [val, setVal] = useState(
    PgProgramInfo.getPk()?.programPk?.toBase58() ?? ""
  );
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoProps>({});
  const [changed, setChanged] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pkResult = PgProgramInfo.getPk();
    if (pkResult?.programPk) {
      const pkStr = pkResult.programPk.toBase58();
      setVal(pkStr);
    }
  }, [programIdCount, setVal]);

  useEffect(() => {
    try {
      new PublicKey(val);
      inputRef.current?.classList.remove(ClassName.ERROR);
    } catch {
      inputRef.current?.classList.add(ClassName.ERROR);
    }
  }, [val]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
    setChanged(true);
    setUpdateInfo({});
  };

  const handleClick = () => {
    try {
      new PublicKey(val);
      PgProgramInfo.update({ customPk: val });

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
    const customPk = PgProgramInfo.getCustomPk();
    if (customPk) {
      const kp = PgProgramInfo.getKp()?.programKp;
      if (kp) return !kp.publicKey.equals(customPk);
    }

    return false;
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
          ref={inputRef}
          value={val}
          onChange={handleChange}
          placeholder="Your program's public key"
          fullWidth
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

// New keypair modal
const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;

  & > a {
    margin-top: 1rem;
  }
`;
const MainText = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.font?.size.small};
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
  font-size: ${({ theme }) => theme.font?.size.small};
`;

const InputLabel = styled.span`
  margin-bottom: 0.375rem;
  font-size: ${({ theme }) => theme.font?.size.small};
`;

const UpdateInfo = styled.span<UpdateInfoProps>`
  ${({ theme, error }) => css`
    margin-left: 0.375rem;
    font-size: ${theme.font?.size.small};
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
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};

    & > svg {
      color: ${theme.colors.state.warning.color};
      margin-right: 0.375rem;
    }
  `}
`;

export default ProgramCredentials;
