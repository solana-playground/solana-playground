import { useAtom } from "jotai";
import styled from "styled-components";

import { Endpoint, EXPLORER_URL, SOLSCAN_URL } from "../../constants";
import { endpointAtom, txHashAtom } from "../../state";
import Link from "../Link";

export const ExplorerLink = () => {
  const [txHash] = useAtom(txHashAtom);
  const [endpoint] = useAtom(endpointAtom);

  const [explorer, solscan] = getUrls(txHash, endpoint);

  return (
    <Wrapper>
      <Link href={explorer}>Solana Explorer</Link>
      {solscan && <Link href={solscan}>Solscan</Link>}
    </Wrapper>
  );
};

const getUrls = (txHash: string, endpoint: Endpoint) => {
  const explorer =
    EXPLORER_URL + "/tx/" + txHash + "?cluster=custom&customUrl=" + endpoint;

  let cluster = "";
  if (endpoint === Endpoint.LOCALHOST) return [explorer];
  else if (
    endpoint === Endpoint.DEVNET ||
    endpoint === Endpoint.DEVNET_GENESYSGO
  )
    cluster = "?cluster=devnet";
  else if (endpoint === Endpoint.TESTNET) cluster = "?cluster=testnet";

  const solscan = SOLSCAN_URL + "/tx/" + txHash + cluster;

  return [explorer, solscan];
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-around;

  & > a:hover {
    text-decoration: underline;
  }
`;
