import { FC, useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import InstructionInput from "./InstructionInput";
import InstructionProvider from "./InstructionProvider";
import Interaction from "../Interaction";
import Button from "../../../../../components/Button";
import Foldable from "../../../../../components/Foldable";
import { Emoji } from "../../../../../constants";
import {
  PgCommand,
  PgCommon,
  PgConnection,
  PgSettings,
  PgTerminal,
  PgTx,
} from "../../../../../utils/pg";
import {
  GeneratableInstruction,
  IdlAccount,
  IdlInstruction,
  PgProgramInteraction,
} from "../../.././../../utils/pg/program-interaction";
import { useWallet } from "../../../../../hooks";

interface InstructionProps {
  idlInstruction: IdlInstruction;
  index: number;
}

const Instruction: FC<InstructionProps> = ({ index, idlInstruction }) => {
  const [instruction, setInstruction] = useState<GeneratableInstruction>({
    name: idlInstruction.name,
    values: {
      programId: { generator: { type: "Current program" } },
      accounts: (idlInstruction.accounts as IdlAccount[]).map((acc) => ({
        ...acc,
        generator: {
          type: "Custom",
          value: PgProgramInteraction.getKnownAccountKey(acc.name),
        },
      })),
      args: idlInstruction.args.map((arg) => ({
        ...arg,
        generator: { type: "Custom", value: "" },
      })),
    },
  });
  const [disabled, setDisabled] = useState(true);

  // Refresh instruction on interval in order to pass the latest generators to
  // `InstructionInput`, otherwise the inital values are being generated from
  // stale data.
  useEffect(() => {
    const id = PgCommon.setIntervalOnFocus(
      () => setInstruction((ix) => ({ ...ix })),
      2000
    );
    return () => clearInterval(id);
  }, []);

  const handleTest = useCallback(async () => {
    const conn = PgConnection.current;

    const showLogTxHash = await PgTerminal.process(async () => {
      PgTerminal.log(PgTerminal.info(`Testing '${instruction.name}'...`));

      try {
        const txHash = await PgCommon.transition(
          PgProgramInteraction.test(instruction)
        );
        PgTx.notify(txHash);
        if (PgSettings.testUi.showTxDetailsInTerminal) return txHash;

        const txResult = await PgTx.confirm(txHash, conn);
        const msg = txResult?.err
          ? `${Emoji.CROSS} ${PgTerminal.error(
              `Test '${instruction.name}' failed`
            )}.`
          : `${Emoji.CHECKMARK} ${PgTerminal.success(
              `Test '${instruction.name}' passed`
            )}.`;
        PgTerminal.log(msg + "\n", { noColor: true });
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        console.log(e.message, convertedError);
        PgTerminal.log(
          `${Emoji.CROSS} ${PgTerminal.error(
            `Test '${instruction.name}' failed`
          )}: ${convertedError}\n`,
          { noColor: true }
        );
      }
    });

    if (showLogTxHash) {
      await PgCommon.sleep(conn.rpcEndpoint.startsWith("https") ? 1500 : 200);
      await PgCommand.solana.run(`confirm ${showLogTxHash} -v`);
    }
  }, [instruction]);

  const { wallet } = useWallet();

  return (
    <InstructionProvider
      instruction={instruction}
      setInstruction={setInstruction}
    >
      <Interaction name={instruction.name} index={index}>
        <ArgsAndAccountsWrapper>
          {instruction.values.args.length > 0 && (
            <Foldable element={<ArgsText>Args</ArgsText>} isOpen>
              <InstructionInputsWrapper>
                {instruction.values.args.map((arg) => (
                  <InstructionInput
                    key={arg.name}
                    prefix="args"
                    updateInstruction={({
                      updateGenerator,
                      updateRefs,
                      checkErrors,
                    }) => {
                      updateGenerator(arg);
                      updateRefs(arg, "Arguments");
                      setDisabled(checkErrors());
                    }}
                    {...arg}
                  />
                ))}
              </InstructionInputsWrapper>
            </Foldable>
          )}

          {instruction.values.accounts.length > 0 && (
            <Foldable element={<AccountsText>Accounts</AccountsText>} isOpen>
              <InstructionInputsWrapper>
                {instruction.values.accounts.map((acc) => (
                  <InstructionInput
                    key={acc.name}
                    prefix="accounts"
                    type="publicKey"
                    updateInstruction={({
                      updateGenerator,
                      updateRefs,
                      checkErrors,
                    }) => {
                      updateGenerator(acc);
                      updateRefs(acc, "Accounts");
                      setDisabled(checkErrors());
                    }}
                    {...acc}
                  />
                ))}
              </InstructionInputsWrapper>
            </Foldable>
          )}
        </ArgsAndAccountsWrapper>

        <ButtonWrapper>
          <Button
            kind="primary"
            onClick={handleTest}
            disabled={!wallet || disabled}
          >
            Test
          </Button>
        </ButtonWrapper>
      </Interaction>
    </InstructionProvider>
  );
};

const ArgsAndAccountsWrapper = styled.div`
  padding-left: 0.25rem;

  & > div {
    margin-top: 1rem;
  }
`;

const InstructionInputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.font.code.size.small};
`;

const ArgsText = styled.span``;

const AccountsText = styled.span``;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;

  & > button {
    padding: 0.5rem 1.5rem;
  }
`;

export default Instruction;
