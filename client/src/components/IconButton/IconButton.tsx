import { CSSProperties, FC, Ref } from "react";
import styled from "styled-components";

import { ClassName } from "../../constants";

interface IconButtonProps {
  id?: string;
  src?: string;
  style?: CSSProperties;
  title?: string;
  onClick?: () => void;
  // React doesn't allow ref being passed as a prop to a functional component
  reff?: Ref<HTMLDivElement>;
}

const IconButton: FC<IconButtonProps> = ({
  id,
  src,
  style,
  title,
  onClick,
  reff,
}) => (
  <IconWrapper
    id={id}
    title={title}
    onClick={onClick}
    ref={reff}
    style={style ? { ...style } : {}}
  >
    <Icon src={src} style={style ? { ...style, padding: "0.25rem" } : {}} />
  </IconWrapper>
);

const IconWrapper = styled.div`
  cursor: pointer;
  width: 100%;
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;

  &.${ClassName.ACTIVE} {
    background-color: ${({ theme }) => theme.colors?.iconButton?.selectedBg};
    border-left: 2px solid
      ${({ theme }) =>
        theme.colors?.iconButton?.selectedBorderColor ??
        theme.colors.default.secondary};
    border-right: 2px solid transparent;
  }

  &.${ClassName.ACTIVE} img,
  &:hover:not(.${ClassName.ACTIVE}) img {
    filter: invert(1);
  }
`;

const Icon = styled.img`
  width: 2rem;
  height: 2rem;
  padding: 0.25rem;
  filter: invert(0.5);
`;

export default IconButton;
