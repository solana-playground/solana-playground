import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import styled, { css } from "styled-components";

import { ShortArrow } from "../Icons";

interface FoldableProps {
  element: ReactNode;
  isOpen?: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
}

const Foldable: FC<FoldableProps> = ({
  element,
  isOpen = false,
  setIsOpen,
  children,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  const handleClick = useCallback(() => {
    if (setIsOpen) setIsOpen((o) => !o);
    else setShow((s) => !s);
  }, [setIsOpen]);

  return (
    <>
      <ClickElWrapper onClick={handleClick} show={show}>
        <ShortArrow />
        {element}
      </ClickElWrapper>

      {show && <InsideWrapper>{children}</InsideWrapper>}
    </>
  );
};

const ClickElWrapper = styled.div<{ show: boolean }>`
  ${({ theme, show }) => css`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: fit-content;
    user-select: none;
    font-weight: bold;
    color: ${show
      ? theme.colors.default.textPrimary
      : theme.colors.default.textSecondary};
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    &:hover {
      cursor: pointer;
      color: ${theme.colors.default.textPrimary};
    }

    & svg:first-child {
      margin-right: 0.5rem;
      ${show && "transform: rotate(90deg);"}
    }
  `}
`;

const InsideWrapper = styled.div`
  margin-top: 0.5rem;
`;

export default Foldable;
