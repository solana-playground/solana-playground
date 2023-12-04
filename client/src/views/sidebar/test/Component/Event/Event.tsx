import { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import CodeResult from "../CodeResult";
import Foldable from "../../../../../components/Foldable";
import { PgCommon } from "../../../../../utils/pg";
import { PgProgramInteraction } from "../../../../../utils/pg/program-interaction";
import { useConnection, useWallet } from "../../../../../hooks";
import { useIdl } from "../IdlProvider";

interface EventProps {
  index: number;
  eventName: string;
}

const Event: FC<EventProps> = ({ index, eventName }) => {
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const { idl } = useIdl();

  const [receivedEvents, setReceivedEvents] = useState<object[]>([]);

  useEffect(() => {
    if (!(idl && connection && wallet)) return;

    const program = PgProgramInteraction.getAnchorProgram();
    const listener = program.addEventListener(eventName, (emittedEvent) => {
      setReceivedEvents((eventsSoFar) => [...eventsSoFar, emittedEvent]);
    });

    return () => {
      program.removeEventListener(listener);
    };
  }, [eventName, idl, connection, wallet]);

  return (
    <EventWrapper index={index}>
      <Foldable
        element={
          <EventName>{`${eventName} (${receivedEvents.length})`}</EventName>
        }
      >
        <CodeResult index={index}>
          {receivedEvents.map((ev) => PgCommon.prettyJSON(ev)).join("\n")}
        </CodeResult>
      </Foldable>
    </EventWrapper>
  );
};

interface EventWrapperProps {
  index: number;
}

const EventWrapper = styled.div<EventWrapperProps>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.border};
    background: ${index % 2 === 0 &&
    theme.components.sidebar.right.default.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.border};
    }
  `}
`;

const EventName = styled.span`
  font-weight: bold;
`;

export default Event;
