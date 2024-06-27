import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Button from "../../../../../components/Button";
import ExportButton from "../../../../../components/ExportButton";
import ImportButton from "../../../../../components/ImportButton";
import {
  PgCommand,
  PgCommon,
  PgProgramInfo,
  PgWallet,
} from "../../../../../utils/pg";
import { useRenderOnChange } from "../../../../../hooks";

const IDL = () => (
  <Wrapper>
    <Import />
    <Export />
    <InitOrUpgrade />
  </Wrapper>
);

const Import = () => {
  const handleImport = async (ev: ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeBytes(arrayBuffer);

      PgProgramInfo.update({
        idl: JSON.parse(decodedString),
      });
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <ImportButton accept=".json" onImport={handleImport} showImportText>
      Import
    </ImportButton>
  );
};

const Export = () => {
  useRenderOnChange(PgProgramInfo.onDidChangeIdl);

  if (!PgProgramInfo.idl) return null;

  return (
    <ExportButton href={PgProgramInfo.idl} fileName="idl.json">
      Export
    </ExportButton>
  );
};

enum InitOrUpgradeState {
  HIDDEN,
  HAS_ERROR,
  INCORRECT_AUTHORITY,
  IS_FETCHING,
  IS_INITIALIZING,
  IS_UPGRADING,
  CAN_INIT,
  CAN_UPGRADE,
}

const InitOrUpgrade = () => {
  const [state, setState] = useState<InitOrUpgradeState>(
    InitOrUpgradeState.HIDDEN
  );

  const buttonText = useMemo(() => {
    switch (state) {
      case InitOrUpgradeState.HAS_ERROR:
        return "Retry";
      case InitOrUpgradeState.IS_FETCHING:
        return "Fetching";
      case InitOrUpgradeState.IS_INITIALIZING:
        return "Initializing";
      case InitOrUpgradeState.IS_UPGRADING:
        return "Upgrading";
      case InitOrUpgradeState.CAN_INIT:
        return "Initialize";
      case InitOrUpgradeState.CAN_UPGRADE:
      case InitOrUpgradeState.INCORRECT_AUTHORITY:
        return "Upgrade";
    }
  }, [state]);

  const [loading, disabled] = useMemo(() => {
    switch (state) {
      case InitOrUpgradeState.IS_FETCHING:
      case InitOrUpgradeState.IS_INITIALIZING:
      case InitOrUpgradeState.IS_UPGRADING:
        return [true, true];
      case InitOrUpgradeState.INCORRECT_AUTHORITY:
        return [false, true];
      default:
        return [false, false];
    }
  }, [state]);

  const getIdl = useCallback(async () => {
    try {
      if (!PgProgramInfo.idl || !PgProgramInfo.pk || !PgWallet.current) {
        setState(InitOrUpgradeState.HIDDEN);
        return;
      }

      setState(InitOrUpgradeState.IS_FETCHING);
      const idlResult = await PgCommon.transition(PgProgramInfo.fetchIdl());
      if (!idlResult) {
        setState(InitOrUpgradeState.CAN_INIT);
        return;
      }

      if (idlResult.authority.equals(PgWallet.current.publicKey)) {
        setState(InitOrUpgradeState.CAN_UPGRADE);
        return;
      }

      setState(InitOrUpgradeState.INCORRECT_AUTHORITY);
    } catch (e: any) {
      console.log("Couldn't get IDL:", e.message);
      setState(InitOrUpgradeState.HAS_ERROR);
    }
  }, []);

  // Execute the `getIdl` function
  useEffect(() => {
    const { dispose } = PgCommon.batchChanges(getIdl, [
      PgProgramInfo.onDidChange,
      PgWallet.onDidChangeCurrent,
    ]);
    return () => dispose();
  }, [getIdl]);

  const handleInitOrUpgrade = async () => {
    switch (state) {
      case InitOrUpgradeState.CAN_INIT: {
        setState(InitOrUpgradeState.IS_INITIALIZING);
        await PgCommand.anchor.run("idl", "init");
        break;
      }
      case InitOrUpgradeState.CAN_UPGRADE: {
        setState(InitOrUpgradeState.IS_UPGRADING);
        await PgCommand.anchor.run("idl", "upgrade");
        break;
      }
    }

    await getIdl();
  };

  if (state === InitOrUpgradeState.HIDDEN) return null;

  return (
    <Button
      disabled={disabled}
      btnLoading={loading}
      onClick={handleInitOrUpgrade}
    >
      {buttonText}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

export default IDL;
