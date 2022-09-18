import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";
import { useConnection } from "@solana/wallet-adapter-react";

import { explorerAtom, refreshExplorerAtom } from "../../state";
import { useCurrentWallet } from "../Panels/Wallet";
import { PgTerminal, PgTest } from "../../utils/pg";

const ClientHelper = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const { connection } = useConnection();
  const { currentWallet: wallet } = useCurrentWallet();

  useEffect(() => {
    const handleTest = () => {
      PgTerminal.run(async () => {
        const code = explorer?.getCurrentFile()?.content;
        if (code) {
          const { PgClient } = await import("../../utils/pg/test/client");
          await PgClient.run(code, wallet, connection);
        }
      });
    };

    document.addEventListener(PgTest.EVT_NAME_TEST_CLIENT, handleTest);
    return () => {
      document.removeEventListener(PgTest.EVT_NAME_TEST_CLIENT, handleTest);
    };

    // eslint-disable-next line react-hooks/exhausive-deps
  }, [explorer, explorerChanged, connection, wallet]);

  return <StyledIframe title="test" loading="lazy" />;
};

const StyledIframe = styled.iframe`
  display: none;
`;

export default ClientHelper;
