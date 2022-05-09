import { FC } from "react";
import useCopyClipboard from "react-use-clipboard";
import styled from "styled-components";

import Button from "../Button";
import { Copy } from "../Icons";

interface CopyButtonProps {
  copyText: string;
}

const CopyButton: FC<CopyButtonProps> = ({ copyText }) => {
  const [isCopied, setCopied] = useCopyClipboard(copyText);

  return (
    <Wrapper isCopied={isCopied}>
      <Button
        onClick={setCopied}
        kind="icon"
        title={isCopied ? "Copied" : "Copy to clipboard"}
      >
        <Copy />
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ isCopied: boolean }>`
  & > button {
    & svg {
      color: ${({ theme, isCopied }) =>
        isCopied && theme.colors.state.success.color};
    }

    &:hover {
      background-color: transparent;
    }
  }
`;

export default CopyButton;
