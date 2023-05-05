import { useEffect } from "react";
import styled from "styled-components";

import { EventName } from "../../constants";
import { PgTerminal } from "../../utils/pg";
import { useSendAndReceiveCustomEvent } from "../../hooks";
import type { ClientOptions } from "../../utils/pg/client";

const ClientHelper = () => {
  // Redefine `console.log` to show mocha logs in the terminal.
  // This must happen before `PgClient` is imported.
  useEffect(() => {
    console.log = PgTerminal.consoleLog;
  }, []);

  // Handle events
  useSendAndReceiveCustomEvent(
    EventName.CLIENT_RUN,
    async (ev: UIEvent & ClientOptions) => {
      const { PgClient } = await import("../../utils/pg/client");
      const { isTest, path } = ev;
      await PgClient.run({ path, isTest });
    },
    []
  );

  return <HiddenIframe title="test" loading="lazy" />;
};

const HiddenIframe = styled.iframe`
  display: none;
`;

export default ClientHelper;
