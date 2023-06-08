import { FC, useEffect, useState } from "react";
import { Idl } from "@project-serum/anchor";
import styled, { css } from "styled-components";

import Foldable from "../../../../../../components/Foldable";
import { CodeResult } from "./CodeResult";
import { PgCommon, PgTest } from "../../../../../../utils/pg";
import { useConnection, useWallet } from "../../../../../../hooks";

interface EventProps {
  index: number;
  eventName: string;
  idl: Idl;
}

const Event: FC<EventProps> = ({ index, eventName, idl }) => {
  const [receivedEvents, setReceivedEvents] = useState<object[]>([]);

  const { connection } = useConnection();
  const { wallet } = useWallet();

  useEffect(() => {
    const program =
      idl && wallet ? PgTest.getProgram(idl, connection, wallet) : null;
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
  }, [eventName, idl, connection, wallet]);

  return (
    <EventWrapper index={index}>
      <Foldable
        ClickEl={
          <EventName>{`${eventName} (${receivedEvents.length})`}</EventName>
        }
      >
        <StyledCodeResult index={index}>
          {receivedEvents.map((e) => PgCommon.prettyJSON(e)).join("\n")}
        </StyledCodeResult>
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

const StyledCodeResult = styled(CodeResult)`
  margin-top: 0.5rem;
`;

export default Event;
