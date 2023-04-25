import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Text from "../../../../../../components/Text";
import Button, { ButtonProps } from "../../../../../../components/Button";
import { Skeleton } from "../../../../../../components/Loading";
import { ConnectionErrorText } from "../Common";
import {
  buildCountAtom,
  programAtom,
  refreshProgramIdAtom,
  terminalStateAtom,
} from "../../../../../../state";
import { PgProgramInfo, PgTerminal } from "../../../../../../utils/pg";
import { useDeploy } from "./useDeploy";
import { useInitialLoading } from "..";
import {
  useConnect,
  useConnectOrSetupPg,
  useCurrentWallet,
} from "../../../../../../hooks";

// TODO: Cancel deployment
const Deploy = () => {
  const [terminalState] = useAtom(terminalStateAtom);
  const [programIdCount] = useAtom(refreshProgramIdAtom);
  const [buildCount] = useAtom(buildCountAtom);
  const [program] = useAtom(programAtom);

  const { initialLoading, deployed, setDeployed, connError } =
    useInitialLoading();
  const { solWalletPk } = useCurrentWallet();
  const { pgWallet, hasAuthority, upgradeable } = useDeploy(program);

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

  const deploy = useCallback(async () => {
    const deployError = await PgTerminal.execute({ deploy: "" });
    if (!deployError) setDeployed(true);
  }, [setDeployed]);

  const deployButtonProps: ButtonProps = useMemo(
    () => ({
      kind: "primary",
      onClick: deploy,
      disabled: terminalState.deployLoading,
      btnLoading: terminalState.deployLoading,
    }),
    [deploy, terminalState.deployLoading]
  );

  const [hasProgramKp, hasUuid, hasProgramPk] = useMemo(() => {
    const pgProgramInfo = PgProgramInfo.getProgramInfo();
    const hasProgramKp = pgProgramInfo.kp ? true : false;
    const hasUuid = pgProgramInfo.uuid ? true : false;
    const hasProgramPk = PgProgramInfo.getPk()?.programPk ? true : false;

    return [hasProgramKp, hasUuid, hasProgramPk];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdCount, buildCount]);

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
            <div>
              First deployment needs a keypair. You can import it from
              <Bold> Program credentials</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradeable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradeable.</Text>
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

    if (solWalletPk)
      return (
        <Wrapper>
          <Text kind="warning">
            Please disconnect from Phantom Wallet. Deployment can only be done
            from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    let text = ` Ready to ${deployed ? "upgrade" : "deploy"} ${
      program.fileName
    }`;
    if (terminalState.deployLoading) {
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
        <Skeleton height="2rem" />
      </Wrapper>
    );

  if (connError)
    return (
      <Wrapper>
        <ConnectionErrorText />
      </Wrapper>
    );

  // Normal deploy
  if (hasProgramPk) {
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
            <div>
              You need to build the project first or upload a program from
              <Bold> Upload a program</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradeable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradeable.</Text>
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

    if (solWalletPk)
      return (
        <Wrapper>
          <Text kind="warning">
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
      <Text kind="error">Something went wrong.</Text>
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
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};

  & div:first-child + button {
    margin-top: 1.5rem;
  }
`;

const Bold = styled.span`
  font-weight: bold;
`;

export default Deploy;
