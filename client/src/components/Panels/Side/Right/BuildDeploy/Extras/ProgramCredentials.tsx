import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Keypair, PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import { programIdCountAtom } from "../../../../../../state";
import { ClassName } from "../../../../../../constants";
import Button from "../../../../../Button";
import DownloadButton from "../../../../../DownloadButton";
import { Warning } from "../../../../../Icons";
import Input from "../../../../../Input";
import CopyButton from "../../../../../CopyButton";
import UploadButton from "../../../../../UploadButton";
import { PgProgramInfo } from "../../../../../../utils/pg/program-info";
import { PgCommon } from "../../../../../../utils/pg/common";

const ProgramCredentials = () => (
  <Wrapper>
    <ButtonsWrapper>
      <Import />
      <Export />
    </ButtonsWrapper>
    <InputPk />
  </Wrapper>
);
const Import = () => {
  const [, setProgramIdCount] = useAtom(programIdCountAtom);

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
        customPk: Keypair.fromSecretKey(
          Uint8Array.from(buffer)
        ).publicKey.toBase58(),
      });

      // Refresh components
      setProgramIdCount((c) => c + 1);

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
  const programKp = PgProgramInfo.getKp()?.programKp;

  if (!programKp) return null;

  return (
    <DownloadButton
      href={
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(Array.from(programKp.secretKey)))
      }
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
  const [programIdCount, setProgramIdCount] = useAtom(programIdCountAtom);

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
      setProgramIdCount((c) => c + 1);
    } catch {
      setUpdateInfo({ text: "Invalid public key.", error: true });
    }
  };

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
        {"  Note that you need to have this program's authority to upgrade."}
      </InputWarning>
      {changed && (
        <Button onClick={handleClick} kind="outline">
          Change program id
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
    }
  `}
`;

export default ProgramCredentials;
