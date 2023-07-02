import { CSSProperties, FC, Ref } from "react";
import styled, { css } from "styled-components";

import { ClassName } from "../../constants";
import { PgTheme } from "../../utils/pg";

export interface IconButtonProps {
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
  <IconWrapper id={id} title={title} onClick={onClick} ref={reff} style={style}>
    <Icon src={src} style={style ? { ...style, padding: "0.25rem" } : {}} />
  </IconWrapper>
);

const IconWrapper = styled.div`
  ${({ theme }) => css`
    cursor: pointer;
    width: 100%;
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;

    ${PgTheme.convertToCSS(theme.components.sidebar.left.iconButton.default)};

    &.${ClassName.ACTIVE} {
      ${PgTheme.convertToCSS(
        theme.components.sidebar.left.iconButton.selected
      )};
    }

    &.${ClassName.ACTIVE} img,
    &:hover:not(.${ClassName.ACTIVE}) img {
      filter: invert(1);
    }
  `}
`;

const Icon = styled.img`
  width: 2rem;
  height: 2rem;
  padding: 0.25rem;
  filter: invert(0.5);
`;

export default IconButton;
