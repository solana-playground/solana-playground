import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled, { css } from "styled-components";

import { useOnKey } from "../../hooks";

interface MenuWrapperProps extends ComponentPropsWithoutRef<"div"> {
  hide: () => void;
}

export const MenuWrapper = forwardRef<HTMLDivElement, MenuWrapperProps>(
  ({ hide, children, ...props }, ref) => {
    useOnKey("Escape", hide);

    return (
      <Wrapper ref={ref} {...props}>
        {children}
      </Wrapper>
    );
  }
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: absolute;
    z-index: 3;
    padding: 0.25rem 0;
    background-color: ${theme.colors?.right?.otherBg};
    font-size: ${theme.font?.code?.size.small};
    box-shadow: ${theme.boxShadow};
  `}
`;
