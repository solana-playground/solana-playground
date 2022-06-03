import { useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import styled from "styled-components";

import Button, { ButtonProps } from "../../../../Button";
import Text from "../../../../Text";
import useAuthority from "./useAuthority";
import useConnect from "../../../Wallet/useConnect";
import useCurrentWallet from "../../../Wallet/useCurrentWallet";
import useInitialLoading from "../../useInitialLoading";
import useIsDeployed from "./useIsDeployed";
import {
  terminalAtom,
  pgWalletAtom,
  refreshPgWalletAtom,
  terminalProgressAtom,
  txHashAtom,
  programAtom,
} from "../../../../../state";
import {
  PgCommon,
  PgDeploy,
  PgProgramInfo,
  PgTerminal,
} from "../../../../../utils/pg";
import { Wormhole } from "../../../../Loading";
import { ConnectionErrorText } from "../../Common";

// TODO: Cancel deployment

const Deploy = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setProgress] = useAtom(terminalProgressAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [program] = useAtom(programAtom);

  const { initialLoading } = useInitialLoading();
  const { deployed, setDeployed, connError } = useIsDeployed();
  const { hasAuthority, upgradeable } = useAuthority();

  const { connection: conn } = useConnection();
  const { solWalletPk } = useCurrentWallet();

  const [loading, setLoading] = useState(false);

  const deploy = useCallback(async () => {
    if (!pgWallet.connected) return;

    setLoading(true);
    setTerminal(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    setProgress(0.1);

    let msg = "";

    try {
      const startTime = performance.now();
      const txHash = await PgDeploy.deploy(
        conn,
        pgWallet,
        setProgress,
        program.buffer
      );
      const timePassed = (performance.now() - startTime) / 1000;
      setTxHash(txHash);

      msg = `${PgTerminal.success(
        "Deployment successful."
      )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;

      setDeployed(true);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `${PgTerminal.error("Deployment error:")} ${convertedError}`;
    } finally {
      setLoading(false);
      setTerminal(msg + "\n");
      setProgress(0);
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conn,
    pgWalletChanged,
    program,
    setLoading,
    setDeployed,
    setTerminal,
    setTxHash,
  ]);

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
        <Wormhole />
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
  const { pgButtonStatus, handleConnectPg } = useConnect();

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
