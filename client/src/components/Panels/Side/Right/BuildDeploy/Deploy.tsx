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
} from "../../../../../state";
import { PgError } from "../../../../../utils/pg/error";
import useIsDeployed from "./useIsDeployed";
import { ButtonKind } from "../../../../Button/Button";
import useConnect from "../Wallet/useConnect";
import Loading from "../../../../Loading";
import useInitialLoading from "../../useInitialLoading";
import { ConnectionErrorText } from "../../Common";

const Deploy = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminal] = useAtom(terminalAtom);

  const { initialLoading } = useInitialLoading();
  const { deployed, setDeployed, connError } = useIsDeployed();

  const { connection: conn } = useConnection();

  const [loading, setLoading] = useState(false);

  const programIsBuilt = PgProgramInfo.getProgramKp()?.programKp;

  const deploy = useCallback(async () => {
    if (!pgWallet.connected) return;

    setLoading(true);
    setTerminal(
      "Deploying... This could take a while depending on the program size and network conditions."
    );

    let msg = "";

    try {
      await PgDeploy.deploy(conn, pgWallet);

      msg = "Deployment successful.";

      setDeployed(true);
    } catch (e: any) {
      const convertedError = PgError.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
    } finally {
      setTerminal(msg);
      setLoading(false);
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn, pgWalletChanged, setLoading, setDeployed, setTerminal]);

  const [deployButtonProps, deployButtonText] = useMemo(
    () => [
      {
        kind: "primary" as ButtonKind,
        onClick: deploy,
        disabled: loading || !programIsBuilt || !pgWallet.connected,
      },
      loading
        ? deployed
          ? "Upgrading..."
          : "Deploying..."
        : deployed
        ? "Upgrade"
        : "Deploy",
    ],
    [loading, programIsBuilt, pgWallet.connected, deployed, deploy]
  );

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
          <Button {...deployButtonProps}>{deployButtonText}</Button>
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

  // Program is not built
  return null;
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
