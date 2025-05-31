import { FC } from "react";
import styled from "styled-components";

import Link from "../../../components/Link";
import { useBlockExplorer } from "../../../hooks";

interface ExplorerLinkProps {
  txHash: string;
}

export const ExplorerLink: FC<ExplorerLinkProps> = ({ txHash }) => {
  const blockExplorer = useBlockExplorer();

  return (
    <Wrapper>
      <Link href={blockExplorer.getTxUrl(txHash)}>{blockExplorer.name}</Link>
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
