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

  const [events, setReceivedEvents] = useState<object[]>([]);
  useEffect(() => {
    if (!(idl && connection && wallet)) return;

    const { dispose } = PgProgramInteraction.addEventListener(
      eventName,
      (ev) => {
        setReceivedEvents((...events) => [...events, ev]);
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
        {events.map((ev) => PgCommon.toPrettyJson(ev)).join("\n")}
      </CodeResult>
    </Interaction>
  );
};

export default Event;
