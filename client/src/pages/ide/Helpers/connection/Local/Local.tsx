import { useEffect } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../../components/Foldable";
import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Info, Sad } from "../../../../../components/Icons";
import {
  PgCommon,
  PgConnection,
  PgSettings,
  PgView,
  PgWallet,
} from "../../../../../utils/pg";

export const Local = () => {
  // Check localnet connection
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await PgConnection.current.getVersion();

        // Successfully connected to localnet
        if (PgWallet.current) {
          await PgConnection.current.requestAirdrop(
            PgWallet.current.publicKey,
            PgCommon.solToLamports(
              PgCommon.getAirdropAmount(PgConnection.current.rpcEndpoint)!
            )
          );
        }

        // Connection error in the UI depends on whether the `onChain` field
        // exists, and it doesn't get updated after we make the connection to
        // localnet. To get rid of the connection error, we trigger a re-derive
        // of the `onChain` field by updating the connection settings.
        // TODO: Maybe add a `refresh` method for derivables?
        PgSettings.update({ connection: PgSettings.connection });

        // Close the modal
        PgView.setModal(null);
      } catch {}
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <Modal title="Connect to localnet" closeButton>
      <Text kind="error" IconEl={<Sad />}>
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
    <Foldable ClickEl={<strong>Having issues?</strong>}>
      <Text IconEl={<Info color="info" />}>
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
