import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button, { ButtonProps } from "../../../../Button";
import Text from "../../../../Text";
import useInitialLoading from "../../useInitialLoading";
import {
  programAtom,
  TerminalAction,
  terminalStateAtom,
} from "../../../../../state";
import { PgProgramInfo } from "../../../../../utils/pg";
import { ConnectionErrorText } from "../../Common";
import { Skeleton } from "../../../../Loading";
import { useDeploy, useAuthority, useIsDeployed } from "./";
import {
  useConnect,
  useCurrentWallet,
  useConnectOrSetupPg,
} from "../../../Wallet";

// TODO: Cancel deployment
const Deploy = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);
  const [program] = useAtom(programAtom);

  const [loading, setLoading] = useState(false);

  const { initialLoading } = useInitialLoading();
  const { deployed, setDeployed, connError } = useIsDeployed();
  const { hasAuthority, upgradeable } = useAuthority();
  const { solWalletPk } = useCurrentWallet();
  const { runDeploy, pgWallet } = useDeploy(program);

  const deploy = useCallback(async () => {
    const deployErrror = await runDeploy();
    if (!deployErrror) setDeployed(true);
  }, [runDeploy, setDeployed]);

  // Set global mount state
  useEffect(() => {
    setTerminalState(TerminalAction.deployMount);
    return () => setTerminalState(TerminalAction.deployUnmount);
  }, [setTerminalState]);

  // Run build from terminal
  useEffect(() => {
    if (terminalState.deployMounted && terminalState.deployStart) {
      deploy();
    }
  }, [terminalState, deploy]);

  // Loading state for if the command started when the component wasn't mounted
  useEffect(() => {
    if (terminalState.deployMounted) {
      if (terminalState.deployLoading) setLoading(true);
      else setLoading(false);
    }
  }, [terminalState, setLoading]);

  const pgProgramInfo = PgProgramInfo.getProgramInfo();
  const hasProgramKp = pgProgramInfo.kp;
  const hasUuid = pgProgramInfo.uuid;

  const deployButtonText = useMemo(() => {
    let text;
    if (loading) {
      if (deployed) text = "Upgrading...";
      else text = "Deploying...";
    } else {
      if (deployed) text = "Upgrade";
      else text = "Deploy";
    }

    return text;
  }, [loading, deployed]);

  const deployButtonProps: ButtonProps = {
    kind: "primary",
    onClick: deploy,
    disabled: loading,
    btnLoading: loading,
  };

  // Custom(uploaded) program deploy
  if (program.buffer.length) {
    if (!pgWallet.connected)
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
            {
              "First deployment needs a keypair. You can import it from Extra > Program credentials."
            }
          </Text>
        </Wrapper>
      );

    if (upgradeable === false)
      return (
        <Wrapper>
          <Text type="Warning">The program is not upgradeable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text type="Warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (solWalletPk)
      return (
        <Wrapper>
          <Text type="Warning">
            Please disconnect from Phantom Wallet. Deployment can only be done
            from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    let text = ` Ready to ${deployed ? "upgrade" : "deploy"} ${
      program.fileName
    }`;
    if (loading) {
      text = `${deployed ? "Upgrading" : "Deploying"} ${program.fileName}...`;
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

  if (initialLoading)
    return (
      <Wrapper>
        <Skeleton />
      </Wrapper>
    );

  if (connError)
    return (
      <Wrapper>
        <ConnectionErrorText />
      </Wrapper>
    );

  // Normal deploy
  if (PgProgramInfo.getPk()?.programPk) {
    if (!pgWallet.connected)
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );

    if (!hasUuid)
      return (
        <Wrapper>
          <Text>
            {
              "You need to build the project first or upload a program from Extra > Upload a program."
            }
          </Text>
        </Wrapper>
      );

    if (upgradeable === false)
      return (
        <Wrapper>
          <Text type="Warning">The program is not upgradeable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text type="Warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (solWalletPk)
      return (
        <Wrapper>
          <Text type="Warning">
            Please disconnect from Phantom Wallet. Deployment can only be done
            from Playground Wallet.
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
      <Text type="Error">Something went wrong.</Text>
    </Wrapper>
  );
};

const ConnectPgWalletButton = () => {
  const { pgButtonStatus } = useConnect();
  const { handleConnectPg } = useConnectOrSetupPg();

  return (
    <Button onClick={handleConnectPg} kind="primary">
      {pgButtonStatus}
    </Button>
  );
};

const DisconnectSolWalletButton = () => {
  const { solButtonStatus, handleConnect } = useConnect();

  return (
    <Button onClick={handleConnect} kind="outline">
      {solButtonStatus}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.borderColor};

  & div:first-child + button {
    margin-top: 1.5rem;
  }
`;

export default Deploy;
