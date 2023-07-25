import { useMemo } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Text from "../../../../components/Text";
import Button, { ButtonProps } from "../../../../components/Button";
import { Skeleton } from "../../../../components/Loading";
import { terminalStateAtom } from "../../../../state";
import { PgCommand } from "../../../../utils/pg";
import { useProgramInfo, useWallet } from "../../../../hooks";

// TODO: Cancel deployment
const Deploy = () => {
  const [terminalState] = useAtom(terminalStateAtom);

  const {
    loading,
    error,
    deployed,
    upgradable,
    hasAuthority,
    hasProgramKp,
    hasProgramPk,
    hasUuid,
    importedProgram,
  } = useProgramInfo();
  const { wallet } = useWallet();

  const deployButtonText = useMemo(() => {
    let text;
    if (terminalState.deployLoading) {
      if (deployed) text = "Upgrading...";
      else text = "Deploying...";
    } else {
      if (deployed) text = "Upgrade";
      else text = "Deploy";
    }

    return text;
  }, [terminalState.deployLoading, deployed]);

  const deployButtonProps: ButtonProps = useMemo(
    () => ({
      kind: "primary",
      onClick: async () => await PgCommand.deploy.run(),
      disabled: terminalState.deployLoading || terminalState.buildLoading,
      btnLoading: terminalState.deployLoading,
    }),
    [terminalState.deployLoading, terminalState.buildLoading]
  );

  // Custom(uploaded) program deploy
  if (importedProgram?.buffer.length) {
    if (!wallet)
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );

    if (!deployed && !hasProgramKp)
      return (
        <Wrapper>
          <Text>
            <div>
              Initial deployment needs a keypair. You can import it from
              <Bold> Program ID</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text kind="warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (!wallet.isPg)
      return (
        <Wrapper>
          <Text kind="warning">
            Deployment can only be done from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    let text = ` Ready to ${deployed ? "upgrade" : "deploy"} ${
      importedProgram.fileName
    }`;
    if (terminalState.deployLoading) {
      text = `${deployed ? "Upgrading" : "Deploying"} ${
        importedProgram.fileName
      }...`;
    }

    return (
      <Wrapper>
        <Text>{text}</Text>
        <Button {...deployButtonProps}>{deployButtonText}</Button>
      </Wrapper>
    );
  }

  // First time state
  if (!deployed && !hasProgramKp) return null;

  if (loading)
    return (
      <Wrapper>
        <Skeleton height="2rem" />
      </Wrapper>
    );

  if (error)
    return (
      <Wrapper>
        <Text kind="error">
          Connection error. Please try changing the RPC endpoint from the
          settings.
        </Text>
      </Wrapper>
    );

  // Normal deploy
  if (hasProgramPk) {
    if (!wallet)
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );

    if (terminalState.buildLoading)
      return (
        <Wrapper>
          <Button {...deployButtonProps}>{deployButtonText}</Button>
        </Wrapper>
      );

    if (!hasUuid)
      return (
        <Wrapper>
          <Text>
            <div>
              Build the program first or import a program from
              <Bold> Program binary</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text kind="warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (!wallet.isPg)
      return (
        <Wrapper>
          <Text kind="warning">
            Deployment can only be done from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    return (
      <Wrapper>
        <Button {...deployButtonProps}>{deployButtonText}</Button>
      </Wrapper>
    );
  }

  // Shouldn't come here
  return (
    <Wrapper>
      <Text kind="error">Something went wrong.</Text>
    </Wrapper>
  );
};

const ConnectPgWalletButton = () => {
  return (
    <Button onClick={async () => await PgCommand.connect.run()} kind="primary">
      Connect to Playground Wallet
    </Button>
  );
};

const DisconnectSolWalletButton = () => {
  const { wallet } = useWallet();
  if (!wallet || wallet.isPg) return null;

  return (
    <Button onClick={async () => await PgCommand.connect.run()} kind="outline">
      Disconnect from {wallet.name}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};

  & div:first-child + button {
    margin-top: 1.5rem;
  }
`;

const Bold = styled.span`
  font-weight: bold;
`;

export default Deploy;
