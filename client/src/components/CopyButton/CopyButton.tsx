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
    <Tooltip
      element={
        <TooltipElement copied={copied}>
          {copied ? "Copied" : "Copy"}
        </TooltipElement>
      }
    >
      <StyledButton onClick={setCopied} kind="icon" copied={copied}>
        <Copy />
      </StyledButton>
    </Tooltip>
  );
};

const StyledButton = styled(Button)<{ copied: boolean }>`
  ${({ theme, copied }) => css`
    ${copied && `color: ${theme.colors.state.success.color}`};

    &:hover {
      background: transparent;

      ${copied && `color: ${theme.colors.state.success.color}`};
    }
  `};
`;

const TooltipElement = styled.span<{ copied: boolean }>`
  ${({ copied, theme }) => css`
    ${copied && `color: ${theme.colors.state.success.color}`};
  `}
`;

export default CopyButton;
