import { FC, ReactNode, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import Popover, { PopoverProps } from "../Popover/Popover";
import { QuestionMarkOutlined } from "../Icons";

export interface TooltipProps extends Omit<PopoverProps, "anchorEl"> {
  /** Tooltip element to show on hover */
  element?: ReactNode;
}

const Tooltip: FC<TooltipProps> = ({ element, children, ...props }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Wrapper ref={anchorRef}>
      {children}
      {mounted && (
        <Popover {...props} anchorEl={anchorRef.current!} showOnHover>
          {element}
        </Popover>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

export const HelpTooltip: FC<TooltipProps> = (props) => (
  <Tooltip {...props}>
    <StyledQuestionMarkOutlined color="textSecondary" />
  </Tooltip>
);

const StyledQuestionMarkOutlined = styled(QuestionMarkOutlined)`
  &:hover {
    cursor: help;
    color: ${({ theme }) => theme.colors.default.textPrimary};
  }
`;

export default Tooltip;
