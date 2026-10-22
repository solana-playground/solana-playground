import { FC, useEffect, useState } from "react";

import CodeResult from "../CodeResult";
import Interaction from "../Interaction";
import { PgCommon } from "../../../../../utils";
import { PgProgramInteraction } from "../../../../../utils/program-interaction";
import { useConnection, useWallet } from "../../../../../hooks";
import { useIdl } from "../IdlProvider";

interface EventProps {
  eventName: string;
  index: number;
}

const Event: FC<EventProps> = ({ index, eventName }) => {
  const connection = useConnection();
  const wallet = useWallet();
  const { idl } = useIdl();

  const [events, setEvents] = useState<object[]>([]);
  useEffect(() => {
    if (!(idl && connection && wallet)) return;

    const { dispose } = PgProgramInteraction.addEventListener(
      eventName,
      (ev) => {
        setEvents((events) => [...events, ev]);
      }
    );

    // Create an anonymous function because `dispose` returns a `Promise`
    return () => {
      dispose().catch(console.log);
    };
  }, [eventName, idl, connection, wallet]);

  return (
    <Interaction name={`${eventName} (${events.length})`} index={index}>
      <CodeResult index={index}>
        {events.map(PgCommon.toPrettyJson).join("\n")}
      </CodeResult>
    </Interaction>
  );
};

export default Event;
