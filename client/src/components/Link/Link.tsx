import { FC } from "react";
import styled from "styled-components";

import { External } from "../Icons";

interface LinkProps {
  href: string;
}

const Link: FC<LinkProps> = ({ href, children }) => {
  return (
    <StyledLink href={href} target="_blank" rel="noopener">
      {children}
      <External />
    </StyledLink>
  );
};

const StyledLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default Link;
