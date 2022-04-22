import { useCallback, useState } from "react";
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

const Deploy = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminal] = useAtom(terminalAtom);

  const { connection: conn } = useConnection();

  const [loading, setLoading] = useState(false);

  const programIsBuilt = PgProgramInfo.getProgramKp()?.programKp;

  const { deployed, setDeployed } = useIsDeployed();

  const deploy = useCallback(async () => {
    if (!pgWallet.connected) return;

    setLoading(true);
    setTerminal(
      "Deploying... This could take a while depending on the program size and network condition."
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

  return (
    <Wrapper>
      {programIsBuilt ? (
        pgWallet.connected ? (
          <Text>Ready to {deployed ? "upgrade" : "deploy"}</Text>
        ) : (
          <Text>Deployment can only be done from Playground Wallet.</Text>
        )
      ) : (
        <Text>Build the program first.</Text>
      )}
      <Button
        kind="secondary"
        onClick={deploy}
        disabled={loading || !programIsBuilt || !pgWallet.connected}
      >
        {loading
          ? deployed
            ? "Upgrading..."
            : "Deploying..."
          : deployed
          ? "Upgrade"
          : "Deploy"}
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;

  & button {
    margin-top: 1.5rem;
  }
`;

export default Deploy;
