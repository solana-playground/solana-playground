import { FC } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Link from "../../../components/Link";
import { PgCommon } from "../common";
import { connectionConfigAtom } from "../../../state";

interface ExplorerLinkProps {
  txHash: string;
}

export const ExplorerLink: FC<ExplorerLinkProps> = ({ txHash }) => {
  const [conn] = useAtom(connectionConfigAtom);

  const { explorer, solscan } = PgCommon.getExplorerTxUrls(
    txHash,
    conn.endpoint
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
