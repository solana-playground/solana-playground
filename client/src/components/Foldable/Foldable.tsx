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

import { ClassName } from "../../constants";
import { Arrow } from "../Icons";

interface FoldableProps {
  ClickEl: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

const Foldable: FC<FoldableProps> = ({
  ClickEl,
  open = false,
  setOpen,
  children,
}) => {
  const [show, setShow] = useState(false);

  const clickWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShow(open);
  }, [open]);

  const handleClick = useCallback(() => {
    if (setOpen) setOpen((o) => !o);
    else setShow((s) => !s);
  }, [setOpen]);

  useEffect(() => {
    if (show) {
      clickWrapperRef.current?.classList.add(ClassName.OPEN);
    } else {
      clickWrapperRef.current?.classList.remove(ClassName.OPEN);
    }
  }, [show]);

  return (
    <>
      <ClickElWrapper ref={clickWrapperRef} onClick={handleClick}>
        <Arrow />
        {ClickEl}
      </ClickElWrapper>

      {show && children}
    </>
  );
};

const ClickElWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;

  & svg {
    margin-right: 0.5rem;
  }

  &.${ClassName.OPEN} svg {
    transform: rotate(90deg);
  }

  &:hover {
    cursor: pointer;
  }
`;

export default Foldable;
