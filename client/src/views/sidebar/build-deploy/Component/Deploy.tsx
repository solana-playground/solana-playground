import { useMemo } from "react";
import styled from "styled-components";

import Text from "../../../../components/Text";
import Button, { ButtonProps } from "../../../../components/Button";
import { PgCommand, PgGlobal } from "../../../../utils/pg";
import {
  useProgramInfo,
  useRenderOnChange,
  useWallet,
} from "../../../../hooks";
import { Pause, Triangle } from "../../../../components/Icons";

const Deploy = () => {
  const buildLoading = useRenderOnChange(
    PgGlobal.onDidChangeBuildLoading,
    PgGlobal.buildLoading
  );
  const deployState = useRenderOnChange(
    PgGlobal.onDidChangeDeployState,
    PgGlobal.deployState
  );

  const { deployed, error, programInfo } = useProgramInfo();
  const { wallet } = useWallet();
  const upgradable = programInfo.onChain?.upgradable;
  const hasAuthority = wallet
    ? programInfo.onChain?.authority?.equals(wallet.publicKey)
    : false;
  const hasProgramKp = !!programInfo.kp;
  const hasUuid = !!programInfo.uuid;
  const importedProgram = programInfo.importedProgram;
  const isImportedProgram = !!importedProgram?.buffer.length;

  const deployButtonText = useMemo(() => {
    return deployState === "cancelled"
      ? "Cancelling..."
      : deployState === "paused"
      ? "Continue"
      : deployState === "loading"
      ? deployed
        ? "Upgrading..."
        : "Deploying..."
      : deployed
      ? "Upgrade"
      : "Deploy";
  }, [deployState, deployed]);

  const deployButtonProps = useMemo<ButtonProps>(
    () => ({
      kind: "primary",
      onClick: () => {
        switch (deployState) {
          case "ready":
            // TODO: Run commands without writing to terminal and handle the
            // `PgGlobal.deployState` inside the command implementation. The
            // state has to be handled outside of the command because the deploy
            // command is waiting for user input and re-running the command here
            // would overwrite the user input.
            return PgCommand.deploy.run();

          case "loading":
            PgGlobal.update({ deployState: "paused" });
            break;

          case "paused":
            PgGlobal.update({ deployState: "loading" });
        }
      },
      btnLoading: deployState === "cancelled",
      disabled: buildLoading,
      leftIcon:
        deployState === "loading" ? (
          <Pause />
        ) : deployState === "paused" ? (
          <Triangle rotate="90deg" />
        ) : null,
    }),
    [buildLoading, deployState]
  );

  // First time state
  if (!deployed && !hasProgramKp) {
    if (isImportedProgram)
      return (
        <Wrapper>
          <Text>
            <div>
              Initial deployment needs a keypair. You can import it from
              <Bold> Program ID</Bold> settings.
            </div>
          </Text>
        </Wrapper>
      );

    return null;
  }

  if (error)
    return (
      <Wrapper>
        <Text kind="error">
          Connection error. Please try changing the RPC endpoint from the
          settings.
        </Text>
      </Wrapper>
    );

  if (!wallet)
    return (
      <Wrapper>
        <Text>Your wallet must be connected for program deployments.</Text>
        <Button onClick={() => PgCommand.connect.run()} kind="primary">
          Connect to Playground Wallet
        </Button>
      </Wrapper>
    );

  if (!hasUuid && !isImportedProgram)
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

  // Custom(uploaded) program deploy
  if (isImportedProgram) {
    const text =
      deployState === "cancelled"
        ? `Cancelling the ${deployed ? "upgrade" : "deployment"} of ${
            importedProgram.fileName
          }...`
        : deployState === "loading"
        ? `${deployed ? "Upgrading" : "Deploying"} ${
            importedProgram.fileName
          }...`
        : ` Ready to ${deployed ? "upgrade" : "deploy"} ${
            importedProgram.fileName
          }`;

    return (
      <Wrapper>
        <Text>{text}</Text>
        <Button {...deployButtonProps}>{deployButtonText}</Button>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Button {...deployButtonProps}>{deployButtonText}</Button>
    </Wrapper>
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
