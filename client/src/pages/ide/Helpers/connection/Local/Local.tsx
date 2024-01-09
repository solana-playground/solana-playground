import { useEffect } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../../components/Foldable";
import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Info, Sad } from "../../../../../components/Icons";
import { PgCommon, PgConnection, PgView } from "../../../../../utils/pg";

export const Local = () => {
  // Check localnet connection
  useEffect(() => {
    // When this modal shows up, it means there was a connection error to
    // localnet but because `PgConnection.isConnected` gets refreshed every
    // minute, `PgConnection.isConnected` could still be a truthy value.
    //
    // TODO: Remove after making change events not fire on mount by default
    let initial = true;

    const { dispose } = PgConnection.onDidChangeIsConnected((isConnected) => {
      // Only close the modal if it's not `initial` and `isConnected` is true
      if (!initial && isConnected) PgView.closeModal();

      initial = false;
    });

    return () => dispose();
  }, []);

  return (
    <Modal title="Connect to localnet">
      <Text kind="error" icon={<Sad />}>
        Unable to connect to localnet
      </Text>

      <Content>
        <ContentTitle>How to connect</ContentTitle>
        <ContentDescription>
          Here are the steps for connecting to localnet from playground.
        </ContentDescription>

        <MarkdownSteps codeFontOnly>
          {require("./steps.md")
            .replace("<OS_NAME>", PgCommon.getOS() ?? "Other")
            .replace(
              "<OS_INSTALLATION>",
              PgCommon.getOS() === "Windows"
                ? require("./install-windows.md")
                : require("./install-unix.md")
            )}
        </MarkdownSteps>

        <Issues />
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  padding: 1rem 0 0.5rem;
`;

const ContentTitle = styled.div`
  font-weight: bold;
  font-size: ${({ theme }) => theme.font.code.size.large};
`;

const ContentDescription = styled.div`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
  `}
`;

const MarkdownSteps = styled(Markdown)`
  margin-top: 1.5rem;
`;

const Issues = () => {
  const browser = PgCommon.getBrowser();
  if (browser === "Firefox") return null;

  return (
    <Foldable element={<strong>Having issues?</strong>}>
      <Text icon={<Info color="info" />}>
        <p>
          If you have a running test validator, it means your browser is
          blocking localhost access and you'll need to enable it in order to
          connect.
        </p>
        {browser === "Brave" && (
          <p>
            For <strong>Brave Browser</strong>: Click the Brave icon at the
            right side of the browser URL bar and drop the shields for this
            website.
          </p>
        )}
      </Text>
    </Foldable>
  );
};
