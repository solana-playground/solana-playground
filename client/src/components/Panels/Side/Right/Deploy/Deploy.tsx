import { useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import styled from "styled-components";

import Button from "../../../../Button";
import { PgDeploy } from "../../../../../utils/pg/deploy";
import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import { terminalAtom } from "../../../../../state";
import { pgWalletAtom, refreshPgWalletAtom } from "../../../../../state/solana";
import Text from "../../../../Text";
import { PgError } from "../../../../../utils/pg/error";

const Deploy = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminal] = useAtom(terminalAtom);

  const { connection: conn } = useConnection();

  const [loading, setLoading] = useState(false);

  const programIsBuilt = useMemo(() => {
    const pkResult = PgProgramInfo.getProgramKp();
    if (pkResult.programKp) return true;
  }, []);

  const deployed = PgProgramInfo.getProgramInfo().deployed;

  const deploy = useCallback(async () => {
    if (!pgWallet.connected) return;
    setLoading(true);

    setTerminal("Deploying...");

    let msg = "";

    try {
      await PgDeploy.deploy(conn, pgWallet);

      PgProgramInfo.updateProgramInfo({ deployed: true });

      msg = "Deployment successful";
    } catch (e: any) {
      const convertedError = PgError.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
    } finally {
      setTerminal(msg);
      setLoading(false);
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn, pgWalletChanged, setLoading, setTerminal]);

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
        kind="primary"
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
  padding: 1.5rem;

  & button {
    margin-top: 1.5rem;
  }
`;

export default Deploy;
