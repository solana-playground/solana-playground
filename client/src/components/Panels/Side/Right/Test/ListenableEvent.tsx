import { Idl, Program } from "@project-serum/anchor";
import { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import Foldable from "../../../../Foldable";
import { CodeResult } from "./CodeResult";

interface EventProps {
  program: Program<Idl> | null;
  eventName: string;
  index: number;
}

const ListenableEvent: FC<EventProps> = ({ program, eventName, index }) => {
  const [receivedEvents, setReceivedEvents] = useState<object[]>([]);

  useEffect(() => {
    if (!program) return;

    const listener = program.addEventListener(
      eventName,
      (emittedEvent, _slot) => {
        setReceivedEvents((eventsSoFar) => [...eventsSoFar, emittedEvent]);
      }
    );

    return () => {
      program.removeEventListener(listener);
    };
  }, [eventName, program]);

  return (
    <EventWrapper index={index}>
      <Foldable
        ClickEl={
          <EventName>{`${eventName} (${receivedEvents.length})`}</EventName>
        }
      >
        <CodeResult index={index}>
          {receivedEvents.map((e) => JSON.stringify(e, null, 2)).join("\n")}
        </CodeResult>
      </Foldable>
    </EventWrapper>
  );
};

interface IndexProp {
  index: number;
}

const EventWrapper = styled.div<IndexProp>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.borderColor};
    background-color: ${index % 2 === 0 && theme.colors.right?.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }
  `}
`;

const EventName = styled.span`
  font-weight: bold;
  margin: 0.5rem 0;
`;

export default ListenableEvent;
