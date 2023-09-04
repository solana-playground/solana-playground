import { FC } from "react";
import styled, { css } from "styled-components";

import { External } from "../Icons";

interface LinkProps {
  href: string;
  showExternalIcon?: boolean;
  className?: string;
}

const Link: FC<LinkProps> = ({
  href,
  className,
  showExternalIcon = true,
  children,
}) => {
  return (
    <StyledLink
      className={className}
      href={href}
      target="_blank"
      rel="noopener"
    >
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

export const DefaultLink: FC<LinkProps> = ({
  href,
  showExternalIcon,
  className,
  children,
}) => (
  <a
    className={className}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
    {showExternalIcon && <External />}
  </a>
);

export const StyledDefaultLink = styled(DefaultLink)`
  ${({ theme }) => css`
    color: ${theme.colors.default.primary};

    &:hover {
      text-decoration: underline;
    }

    & svg {
      margin-left: 0.25rem;
      color: ${theme.colors.default.primary};
    }
  `}
`;

export default Link;
