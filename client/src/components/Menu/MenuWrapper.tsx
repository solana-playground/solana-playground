import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled from "styled-components";

import { ClassName } from "../../constants";
import { useOnKey } from "../../hooks";

interface MenuWrapperProps extends ComponentPropsWithoutRef<"div"> {
  hide: () => void;
}

export const MenuWrapper = forwardRef<HTMLDivElement, MenuWrapperProps>(
  ({ hide, className, children, ...props }, ref) => {
    useOnKey("Escape", hide);

    return (
      <Wrapper
        ref={ref}
        className={`${className} ${ClassName.MENU_WRAPPER}`}
        {...props}
      >
        {children}
      </Wrapper>
    );
  }
);

const Wrapper = styled.div`
  position: absolute;
  z-index: 3;
`;
