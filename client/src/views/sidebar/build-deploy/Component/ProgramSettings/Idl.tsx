import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Button from "../../../../../components/Button";
import {
  PgCommand,
  PgCommon,
  PgExplorer,
  PgProgramInfo,
  PgWallet,
} from "../../../../../utils";
import { useRenderOnChange } from "../../../../../hooks";

const Idl = () => (
  <Wrapper>
    <Import />
    <Export />
    <Deploy />
  </Wrapper>
);

const Import = () => {
  const handleImport = async (ev: ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const text = await file.text();
      const idl = JSON.parse(text);
      PgProgramInfo.update({ idl });
    } catch (e: any) {
      console.log("Failed to import IDL:", e?.message);
    }
  };

  return (
    <Button.Import accept=".json" onImport={handleImport} showImportText>
      Import
    </Button.Import>
  );
};

const Export = () => {
  const idl = useRenderOnChange(PgProgramInfo.onDidChangeIdl);
  if (!idl) return null;

  return (
    <Button.Export href={idl} fileName="idl.json">
      Export
    </Button.Export>
  );
};

enum DeployState {
  HIDDEN,
  ERROR,
  INCORRECT_AUTHORITY,
  IMMUTABLE,
  FETCHING,
  DEPLOYING,
  READY,
}

const Deploy = () => {
  const [state, setState] = useState<DeployState>(DeployState.HIDDEN);

  const buttonText = useMemo(() => {
    switch (state) {
      case DeployState.ERROR:
        return "Retry";
      case DeployState.FETCHING:
        return "Fetching";
      case DeployState.DEPLOYING:
        return "Deploying";
      case DeployState.READY:
        return "Deploy";
      case DeployState.IMMUTABLE:
        return "Immutable";
    }
  }, [state]);

  const [loading, disabled] = useMemo(() => {
    switch (state) {
      case DeployState.FETCHING:
      case DeployState.DEPLOYING:
        return [true, true];
      case DeployState.INCORRECT_AUTHORITY:
      case DeployState.IMMUTABLE:
        return [false, true];
      default:
        return [false, false];
    }
  }, [state]);

  const getIdl = useCallback(async () => {
    if (!PgProgramInfo.pk || !PgWallet.current) {
      setState(DeployState.HIDDEN);
      return;
    }

    try {
      setState(DeployState.FETCHING);
      const idlResult = await PgCommon.transition(PgProgramInfo.fetchIdl());
      if (!idlResult) {
        if (!PgProgramInfo.idl) setState(DeployState.HIDDEN);
        else setState(DeployState.READY);
        return;
      }

      if (!idlResult.authority) {
        setState(DeployState.IMMUTABLE);
        return;
      }

      if (!idlResult.authority.equals(PgWallet.current.publicKey)) {
        setState(DeployState.INCORRECT_AUTHORITY);
        return;
      }

      setState(DeployState.READY);
    } catch (e: any) {
      // TODO: Show the error in UI?
      console.log("Failed to get IDL:", e?.message);
      setState(DeployState.ERROR);
    }
  }, []);

  // Execute the `getIdl` function
  useEffect(() => {
    const { dispose } = PgCommon.batchChanges(getIdl, [
      PgProgramInfo.onDidChange,
      PgWallet.onDidChangeCurrent,
    ]);
    return dispose;
  }, [getIdl]);

  const handleDeploy = async () => {
    setState(DeployState.DEPLOYING);

    try {
      // TODO: Handle the file creation better
      const idlFilePath = PgCommon.joinPaths(
        PgExplorer.getProjectRootPath(),
        ".tmp",
        "idl.json"
      );
      await PgExplorer.fs.writeFile(
        idlFilePath,
        JSON.stringify(PgProgramInfo.idl!),
        { createParents: true }
      );
      await PgCommand.programMetadata.execute(
        "write",
        "idl",
        PgProgramInfo.pk!.toBase58(),
        idlFilePath
      );
    } catch {
      setState(DeployState.ERROR);
    } finally {
      await getIdl();
    }
  };

  if (!buttonText || state === DeployState.HIDDEN) return null;

  return (
    <Button disabled={disabled} loading={loading} onClick={handleDeploy}>
      {buttonText}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

export default Idl;
