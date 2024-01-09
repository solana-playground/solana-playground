import { ComponentPropsWithoutRef, forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import styled, { css, DefaultTheme } from "styled-components";

import { External } from "../Icons";
import type { OrString } from "../../utils/pg";

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  href: OrString<RoutePath>;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const isWrapper = typeof props.children !== "string";

  if (props.href.startsWith("/")) {
    return (
      <StyledRouterLink
        ref={ref}
        to={props.href}
        {...props}
        $isWrapper={isWrapper}
      />
    );
  }

  return (
    <StyledAnchor
      ref={ref}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      $isWrapper={isWrapper}
    >
      {props.children}

      {!isWrapper && <External />}
    </StyledAnchor>
  );
});

const getStyles = ({
  $isWrapper,
  theme,
}: {
  $isWrapper: boolean;
  theme: DefaultTheme;
}) => {
  if ($isWrapper) {
    return css`
      & svg {
        color: ${theme.colors.default.textSecondary};
      }

      & > * {
        transition: color ${theme.default.transition.duration.short}
          ${theme.default.transition.type};

        &:hover {
          color: ${theme.colors.default.textPrimary};
        }
      }
    `;
  }

  return css`
    color: ${theme.colors.default.primary};
    border-bottom: 1px solid transparent;
    transition: border-bottom-color ${theme.default.transition.duration.short}
      ${theme.default.transition.type};

    & svg {
      margin-left: 0.25rem;
    }

    &:hover {
      border-bottom-color: ${theme.colors.default.primary};
    }
  `;
};

const StyledAnchor = styled.a`
  ${getStyles}
`;

const StyledRouterLink = styled(RouterLink)`
  ${getStyles}
`;

export default Link;
