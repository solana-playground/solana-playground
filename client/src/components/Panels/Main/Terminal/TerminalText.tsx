import { FC } from "react";
import styled from "styled-components";

interface TerminalTextProps {
  text: string;
}

const TerminalText: FC<TerminalTextProps> = ({ text }) => {
  // TODO: Add highlighting
  return <Wrapper>{text}</Wrapper>;
};

const Wrapper = styled.div`
  white-space: break-spaces;
  line-break: anywhere;
`;

export default TerminalText;
