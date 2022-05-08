import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import { ClassName } from "../../../../../../constants";
import { PgProgramInfo } from "../../../../../../utils/pg/program-info";
import Button from "../../../../../Button";
import DownloadButton from "../../../../../DownloadButton";
import { Warning } from "../../../../../Icons";
import Input from "../../../../../Input";
import CopyButton from "../../../../../CopyButton";
import UploadButton from "../../../../../UploadButton";
import { PgCommon } from "../../../../../../utils/pg/common";

const ProgramCredentials = () => {
  const [newImport, setNewImport] = useState(0);

  return (
    <Wrapper>
      <ButtonsWrapper>
        <Import setNewImport={setNewImport} />
        <Export />
      </ButtonsWrapper>
      <InputPk newImport={newImport} />
    </Wrapper>
  );
};

interface ImportProps {
  setNewImport: Dispatch<SetStateAction<number>>;
}

const Import: FC<ImportProps> = ({ setNewImport }) => {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeArrayBuffer(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      PgProgramInfo.update({ kp: Array.from(buffer) });
      setNewImport((c) => c + 1);
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

interface InputPkProps {
  newImport: number;
}

interface UpdateInfoProps {
  text?: string;
  error?: boolean;
}

const InputPk: FC<InputPkProps> = ({ newImport }) => {
  const [val, setVal] = useState(
    PgProgramInfo.getPk()?.programPk?.toBase58() ?? ""
  );
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoProps>({});
  const [changed, setChanged] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const kpResult = PgProgramInfo.getKp();
    if (kpResult?.programKp) {
      const pkStr = kpResult.programKp.publicKey.toBase58();
      // Override customPk with the new import
      PgProgramInfo.update({ customPk: pkStr });
      setVal(pkStr);
    }
  }, [newImport, setVal]);

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
