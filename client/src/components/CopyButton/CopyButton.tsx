import { FC } from "react";
import styled, { css } from "styled-components";

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
      <StyledButton onClick={setCopied} kind="icon" copied={copied}>
        <Copy />
      </StyledButton>
    </Tooltip>
  );
};

const StyledButton = styled(Button)<{ copied: boolean }>`
  ${({ theme, copied }) => css`
    ${copied && `& svg { color: ${theme.colors.state.success.color}; }`}

    &:hover {
      background: transparent;

      ${copied && `& svg { color: ${theme.colors.state.success.color}; }`}
    }
  `};
`;

export default CopyButton;
