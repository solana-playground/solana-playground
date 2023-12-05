import { FC, useEffect, useState } from "react";

import CodeResult from "../CodeResult";
import Interaction from "../Interaction";
import { PgCommon } from "../../../../../utils/pg";
import { PgProgramInteraction } from "../../../../../utils/pg/program-interaction";
import { useConnection, useWallet } from "../../../../../hooks";
import { useIdl } from "../IdlProvider";

interface EventProps {
  eventName: string;
  index: number;
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
    <Interaction name={`${eventName} (${receivedEvents.length})`} index={index}>
      <CodeResult index={index}>
        {receivedEvents.map((ev) => PgCommon.prettyJSON(ev)).join("\n")}
      </CodeResult>
    </Interaction>
  );
};

export default Event;
