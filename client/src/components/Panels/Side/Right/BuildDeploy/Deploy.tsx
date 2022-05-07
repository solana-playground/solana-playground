import { useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import styled from "styled-components";

import Button from "../../../../Button";
import Text from "../../../../Text";
import { PgDeploy } from "../../../../../utils/pg/deploy";
import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import {
  terminalAtom,
  pgWalletAtom,
  refreshPgWalletAtom,
  terminalProgressAtom,
  txHashAtom,
} from "../../../../../state";
import useIsDeployed from "./useIsDeployed";
import { ButtonKind } from "../../../../Button/Button";
import useConnect from "../Wallet/useConnect";
import Loading from "../../../../Loading";
import useInitialLoading from "../../useInitialLoading";
import { ConnectionErrorText } from "../../Common";
import { PgTerminal } from "../../../../../utils/pg/terminal";
import { programAtom } from "../../../../../state";

const Deploy = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setProgress] = useAtom(terminalProgressAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [program] = useAtom(programAtom);

  const { initialLoading } = useInitialLoading();
  const { deployed, setDeployed, connError } = useIsDeployed();

  const { connection: conn } = useConnection();

  const [loading, setLoading] = useState(false);

  const deploy = useCallback(async () => {
    if (!pgWallet.connected) return;

    setLoading(true);
    setTerminal(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    setProgress(0.1);

    let msg = "";

    try {
      const txHash = await PgDeploy.deploy(
        conn,
        pgWallet,
        setProgress,
        program.buffer
      );
      setTxHash(txHash);

      msg = PgTerminal.success("Deployment successful.");

      setDeployed(true);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
    } finally {
      setLoading(false);
      setTerminal(msg + "\n");
      setProgress(0);
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conn,
    pgWalletChanged,
    program,
    setLoading,
    setDeployed,
    setTerminal,
    setTxHash,
  ]);

  const programIsBuilt = PgProgramInfo.getKp()?.programKp;

  const deployButtonText = useMemo(() => {
    let text;
    if (loading) {
      if (deployed) text = "Upgrading...";
      else text = "Deploying...";
    } else {
      if (deployed) text = "Upgrade";
      else text = "Deploy";
    }

    return text;
  }, [loading, deployed]);

  const deployButtonProps = {
    kind: "primary" as ButtonKind,
    onClick: deploy,
  };

  // Custom program deploy
  if (program.buffer.length) {
    if (pgWallet.connected)
      return (
        <Wrapper>
          <Text>
            Ready to {deployed ? "upgrade" : "deploy"} {program.fileName}
          </Text>
          <Button
            disabled={loading || !pgWallet.connected}
            {...deployButtonProps}
          >
            {deployButtonText}
          </Button>
        </Wrapper>
      );
    else
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );
  }

  if (!programIsBuilt) return null;

  if (initialLoading)
    return (
      <Wrapper>
        <Loading />
      </Wrapper>
    );

  if (connError)
    return (
      <Wrapper>
        <ConnectionErrorText />
      </Wrapper>
    );

  if (programIsBuilt) {
    if (pgWallet.connected)
      return (
        <Wrapper>
          <Text>Ready to {deployed ? "upgrade" : "deploy"}.</Text>
          <Button
            disabled={loading || !programIsBuilt || !pgWallet.connected}
            {...deployButtonProps}
          >
            {deployButtonText}
          </Button>
        </Wrapper>
      );
    // PgWallet not connected
    else
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );
  }

  // Shouldn't come here
  return (
    <Wrapper>
      <Text type="Error">Something went wrong.</Text>
    </Wrapper>
  );
};

const ConnectPgWalletButton = () => {
  const { pgButtonStatus, handleConnectPg } = useConnect();

  return (
    <Button onClick={handleConnectPg} kind="primary">
      {pgButtonStatus}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.borderColor};

  & button {
    margin-top: 1.5rem;
  }
`;

export default Deploy;
