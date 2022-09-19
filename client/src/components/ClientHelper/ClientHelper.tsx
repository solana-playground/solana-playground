import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";
import { useConnection } from "@solana/wallet-adapter-react";

import { explorerAtom, refreshExplorerAtom } from "../../state";
import { useCurrentWallet } from "../Panels/Wallet";
import { PgTerminal } from "../../utils/pg";
import { EventName } from "../../constants";

const ClientHelper = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const { connection } = useConnection();
  const { currentWallet: wallet } = useCurrentWallet();

  useEffect(() => {
    const handle = (e: UIEvent & { detail?: { test?: boolean } }) => {
      PgTerminal.run(async () => {
        const code = explorer?.getCurrentFile()?.content;
        if (code) {
          const { PgClient } = await import("../../utils/pg/client");
          if (e.detail?.test) {
            await PgClient.run(code, wallet, connection, { test: true });
          } else {
            await PgClient.run(code, wallet, connection);
          }
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
