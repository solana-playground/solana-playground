import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import styled from "styled-components";

import { ShortArrow } from "../Icons";
import { PgView } from "../../utils/pg";

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

  const clickWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (show) {
      clickWrapperRef.current?.classList.add(PgView.classNames.OPEN);
    } else {
      clickWrapperRef.current?.classList.remove(PgView.classNames.OPEN);
    }
  }, [show]);

  return (
    <>
      <ClickElWrapper ref={clickWrapperRef} onClick={handleClick}>
        <ShortArrow />
        {element}
      </ClickElWrapper>

      {show && <InsideWrapper>{children}</InsideWrapper>}
    </>
  );
};

const ClickElWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  user-select: none;

  & svg:first-child {
    margin-right: 0.5rem;
  }

  &.${PgView.classNames.OPEN} svg:first-child {
    transform: rotate(90deg);
  }

  &:hover {
    cursor: pointer;
  }
`;

const InsideWrapper = styled.div`
  margin-top: 0.5rem;
`;

export default Foldable;
