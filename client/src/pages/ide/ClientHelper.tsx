import { useCallback, useState } from "react";
import styled from "styled-components";

import { EventName } from "../../constants";
import { PgConnection, PgExplorer, PgTerminal, PgWallet } from "../../utils/pg";
import { useSendAndReceiveCustomEvent } from "../../hooks";

// Only for type
import type { PgClient } from "../../utils/pg/client";

const ClientHelper = () => {
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

  // Handle events
  useSendAndReceiveCustomEvent(
    EventName.CLIENT_RUN,
    async (ev: UIEvent & { isTest?: boolean; path?: string }) => {
      const { isTest, path } = ev;

      PgTerminal.log(
        PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
      );

      const client = await getClient();
      const explorer = await PgExplorer.get();
      const wallet = await PgWallet.get();
      const connection = await PgConnection.get();

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
    },
    [getClient]
  );

  return <StyledIframe title="test" loading="lazy" />;
};

const StyledIframe = styled.iframe`
  display: none;
`;

export default ClientHelper;
