import {
  ComponentType,
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { ClassNames } from "../../constants";
import { Arrow } from "../Icons";

interface FoldableProps {
  ClickEl: ComponentType;
  closed?: boolean;
}

const Foldable: FC<FoldableProps> = ({ ClickEl, closed, children }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const showAtStart = !closed;
    setShow(showAtStart);
    if (showAtStart) {
      clickWrapperRef.current?.classList.add(ClassNames.OPEN);
    }
  }, [setShow, closed]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // Rotate arrow
      e.currentTarget.classList.toggle(ClassNames.OPEN);

      setShow((s) => !s);
    },
    [setShow]
  );

  const clickWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ClickElWrapper ref={clickWrapperRef} onClick={handleClick}>
        <Arrow />
        <ClickEl />
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

  &.open svg {
    transform: rotate(90deg);
  }

  &:hover {
    cursor: pointer;
  }
`;

export default Foldable;
