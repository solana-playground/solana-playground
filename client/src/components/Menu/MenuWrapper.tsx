import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled from "styled-components";

import { ClassName } from "../../constants";
import { useKeybind } from "../../hooks";

interface MenuWrapperProps extends ComponentPropsWithoutRef<"div"> {
  hide: () => void;
}

export const MenuWrapper = forwardRef<HTMLDivElement, MenuWrapperProps>(
  ({ hide, className, children, ...props }, ref) => {
    useKeybind("Escape", hide);

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
