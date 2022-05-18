import { FC } from "react";
import styled from "styled-components";

import useCopy from "./useCopy";
import Button from "../Button";
import { Copy } from "../Icons";
import Tooltip from "../Tooltip";

interface CopyButtonProps {
  copyText: string;
}

const CopyButton: FC<CopyButtonProps> = ({ copyText }) => {
  const [copied, setCopied] = useCopy(copyText);

  return (
    <Tooltip text={copied ? "Copied" : "Copy"}>
      <Wrapper copied={copied}>
        <Button onClick={setCopied} kind="icon">
          <Copy />
        </Button>
      </Wrapper>
    </Tooltip>
  );
};

const Wrapper = styled.div<{ copied: boolean }>`
  & > button {
    & > svg {
      color: ${({ theme, copied }) =>
        copied && theme.colors.state.success.color};
    }

    &:hover {
      background-color: transparent;
    }
  }
`;

export default CopyButton;
