import { FC } from "react";
import styled from "styled-components";

import Markdown from "../Markdown";

interface CodeBlockProps {
  /** Markdown language identifer, e.g. `js` */
  language?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ language, children }) => (
  <StyledMarkdown>
    {`
\`\`\`${language}
${children}
\`\`\`
`}
  </StyledMarkdown>
);

const StyledMarkdown = styled(Markdown)`
  margin-top: 0.5rem;
`;

export default CodeBlock;
