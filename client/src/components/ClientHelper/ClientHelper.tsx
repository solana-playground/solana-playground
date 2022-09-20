import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";
import { useConnection } from "@solana/wallet-adapter-react";

import { useCurrentWallet } from "../Panels/Wallet";
import { explorerAtom, refreshExplorerAtom } from "../../state";
import { EventName } from "../../constants";
import { PgTerminal } from "../../utils/pg";

const ClientHelper = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const { connection } = useConnection();
  const { currentWallet: wallet } = useCurrentWallet();

  useEffect(() => {
    const handle = (e: UIEvent & { detail?: { isTest?: boolean } }) => {
      PgTerminal.run(async () => {
        const code = explorer?.getCurrentFile()?.content;
        if (code) {
          const isTest = e.detail?.isTest;
          if (isTest) {
            // Redefine console.log to show mocha logs in the terminal
            console.log = PgTerminal.consoleLog;
          }

          const { PgClient } = await import("../../utils/pg/client");
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
