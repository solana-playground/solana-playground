import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";
import { useConnection } from "@solana/wallet-adapter-react";

import { useCurrentWallet } from "../Panels/Wallet";
import { explorerAtom, refreshExplorerAtom } from "../../state";
import { EventName } from "../../constants";
import { PgExplorer, PgTerminal } from "../../utils/pg";

const ClientHelper = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const { connection } = useConnection();
  const { currentWallet: wallet } = useCurrentWallet();

  useEffect(() => {
    const handle = (e: UIEvent & { detail?: { isTest?: boolean } }) => {
      PgTerminal.run(async () => {
        if (!explorer) return;
        const isTest = e.detail?.isTest;

        // Redefine console.log to show mocha logs in the terminal
        console.log = PgTerminal.consoleLog;

        // Lazy load PgClient
        const { PgClient } = await import("../../utils/pg/client");

        const folderPath = explorer.appendToCurrentWorkspacePath(
          isTest ? PgExplorer.TESTS_DIRNAME : PgExplorer.CLIENT_DIRNAME
        );
        const folder = explorer.getFolderContent(folderPath);
        if (!folder.files.length && !folder.folders.length) {
          let DEFAULT;
          if (isTest) {
            const { DEFAULT_TEST } = await import("../../utils/pg/client");
            DEFAULT = DEFAULT_TEST;
          } else {
            const { DEFAULT_CLIENT } = await import("../../utils/pg/client");
            DEFAULT = DEFAULT_CLIENT;
          }

          const fileName = DEFAULT[0];
          const code = DEFAULT[1];
          await explorer.newItem(folderPath + fileName, code);
          await PgClient.run(code, wallet, connection, {
            isTest,
          });
        }

        for (const fileName of folder.files) {
          const code = explorer.getFullFile(folderPath + fileName)?.content;
          if (!code) continue;

          await PgClient.run(code, wallet, connection, {
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

    // eslint-disable-next line react-hooks/exhausive-deps
  }, [explorer, explorerChanged, connection, wallet]);

  return <StyledIframe title="test" loading="lazy" />;
};

const StyledIframe = styled.iframe`
  display: none;
`;

export default ClientHelper;
