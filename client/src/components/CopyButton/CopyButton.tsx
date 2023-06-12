import { FC } from "react";
import styled from "styled-components";

import Button from "../Button";
import Tooltip from "../Tooltip";
import { Copy } from "../Icons";
import { useCopy } from "../../hooks";

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
    &:hover {
      background: transparent;

      ${({ theme, copied }) =>
        copied && `& svg { color: ${theme.colors.state.success.color}; }`}
    }
  }
`;

export default CopyButton;
