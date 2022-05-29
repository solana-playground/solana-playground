import { FC } from "react";
import styled from "styled-components";

import { External } from "../Icons";

interface LinkProps {
  href: string;
  showExternalIcon?: boolean;
}

const Link: FC<LinkProps> = ({ href, showExternalIcon = true, children }) => {
  return (
    <StyledLink href={href} target="_blank" rel="noopener">
      {children}
      {showExternalIcon && <External />}
    </StyledLink>
  );
};

const StyledLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    text-decoration: underline;
  }

  & > svg {
    margin-left: 0.125rem;
  }
`;

export const DefaultLink: FC<LinkProps> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

export default Link;
