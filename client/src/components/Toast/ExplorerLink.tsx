import { useAtom } from "jotai";
import styled from "styled-components";

import { connAtom, txHashAtom } from "../../state";
import { PgCommon } from "../../utils/pg/common";
import Link from "../Link";

export const ExplorerLink = () => {
  const [txHash] = useAtom(txHashAtom);
  const [conn] = useAtom(connAtom);

  const [explorer, solscan] = PgCommon.getExplorerTxUrls(
    txHash,
    conn.endpoint!
  );

  return (
    <Wrapper>
      <Link href={explorer}>Solana Explorer</Link>
      {solscan && <Link href={solscan}>Solscan</Link>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-around;

  & > a:hover {
    text-decoration: underline;
  }
`;
