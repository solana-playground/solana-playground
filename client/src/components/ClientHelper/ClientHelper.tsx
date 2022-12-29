import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import { EventName } from "../../constants";
import { PgExplorer, PgTerminal } from "../../utils/pg";
import { useCurrentWallet } from "../Panels/Wallet";
import { usePgConnection } from "../../hooks";

// Only for type
import { PgClient } from "../../utils/pg/client";

const ClientHelper = () => {
  const { connection } = usePgConnection();
  const { currentWallet: wallet } = useCurrentWallet();

  const [client, setClient] = useState<PgClient>();

  const getClient = useCallback(async () => {
    if (!client) {
      // Redefine console.log to show mocha logs in the terminal
      // This must be defined before PgClient is imported
      console.log = PgTerminal.consoleLog;

      const { PgClient } = await import("../../utils/pg/client");

      const client = new PgClient();
      setClient(client);
      return client;
    }

    return client;
  }, [client]);

  useEffect(() => {
    const handle = (
      e: UIEvent & { detail: { isTest?: boolean; path?: string } }
    ) => {
      PgTerminal.runCmd(async () => {
        const isTest = e.detail.isTest;
        const path = e.detail.path;

        PgTerminal.log(
          PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
        );

        const client = await getClient();
        const explorer = await PgExplorer.get();

        if (path) {
          const code = explorer.getFileContent(path);
          if (!code) return;
          const fileName = PgExplorer.getItemNameFromPath(path);
          await client.run(code, fileName, wallet, connection, {
            isTest,
          });

          return;
        }

        const folderPath = explorer.appendToCurrentWorkspacePath(
          isTest
            ? PgExplorer.PATHS.TESTS_DIRNAME
            : PgExplorer.PATHS.CLIENT_DIRNAME
        );
        const folder = explorer.getFolderContent(folderPath);
        if (!folder.files.length && !folder.folders.length) {
          let DEFAULT;
          if (isTest) {
            PgTerminal.log(PgTerminal.info("Creating default test..."));
            DEFAULT = client.DEFAULT_TEST;
          } else {
            PgTerminal.log(PgTerminal.info("Creating default client..."));
            DEFAULT = client.DEFAULT_CLIENT;
          }

          const fileName = DEFAULT[0];
          const code = DEFAULT[1];
          await explorer.newItem(folderPath + fileName, code);
          await client.run(code, fileName, wallet, connection, {
            isTest,
          });
        }

        for (const fileName of folder.files) {
          const code = explorer.getFileContent(folderPath + fileName);
          if (!code) continue;

          await client.run(code, fileName, wallet, connection, {
            isTest,
          });
        }
      });
    };

    document.addEventListener(EventName.CLIENT_RUN, handle as EventListener);
    return () => {
      document.removeEventListener(
        EventName.CLIENT_RUN,
        handle as EventListener
      );
    };
  }, [connection, wallet, getClient]);

  return <StyledIframe title="test" loading="lazy" />;
};

const StyledIframe = styled.iframe`
  display: none;
`;

export default ClientHelper;
