import { createContext, FC, useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Idl } from "@project-serum/anchor";
import { IdlAccount, IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import styled, { css } from "styled-components";

import Account from "./Account";
import Arg from "./Arg";
import Button from "../../../../../../components/Button";
import Foldable from "../../../../../../components/Foldable";
import { updateTxValsProps } from "./useUpdateTxVals";
import { ClassName, Emoji } from "../../../../../../constants";
import { txHashAtom } from "../../../../../../state";
import {
  PgCommon,
  PgPreferences,
  PgTerminal,
  PgTest,
  PgTx,
  TxVals,
} from "../../../../../../utils/pg";
import { useCurrentWallet, usePgConnection } from "../../../../../../hooks";

interface FnContextProps {
  updateTxVals: (props: updateTxValsProps) => void;
}

export const FnContext = createContext<FnContextProps>({} as FnContextProps);

interface InstructionProps extends InstructionInsideProps {
  index: number;
}

const Instruction: FC<InstructionProps> = ({ ix, idl, index }) => (
  <InstructionWrapper index={index}>
    <Foldable ClickEl={<InstructionName>{ix.name}</InstructionName>}>
      <InstructionInside idl={idl} ix={ix} />
    </Foldable>
  </InstructionWrapper>
);

interface InstructionInsideProps {
  ix: IdlInstruction;
  idl: Idl;
}

const InstructionInside: FC<InstructionInsideProps> = ({ ix, idl }) => {
  const [, setTxHash] = useAtom(txHashAtom);

  const { connection: conn } = usePgConnection();

  // State
  const [txVals, setTxVals] = useState<TxVals>({
    name: ix.name,
    additionalSigners: {},
    args: [],
    accs: {},
  });
  const [errors, setErrors] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  // Set errors
  useEffect(() => {
    let totalErrors = 0,
      nameCount = 0;

    for (const name in errors) {
      totalErrors += errors[name];
      nameCount++;
    }

    // Fixes button being enabled at start
    if (!nameCount && ix.accounts.length) {
      return;
    }

    if (totalErrors) setDisabled(true);
    else setDisabled(false);
  }, [errors, ix.accounts.length]);

  const handleErrors = useCallback(
    (identifier: string, k: string, action: "add" | "remove") => {
      setErrors((e) => {
        const name = ix.name + identifier + k;

        if (action === "add") {
          const inputEl = document.getElementsByName(name)[0];
          if (inputEl?.classList.contains(ClassName.TOUCHED))
            inputEl.classList.add(ClassName.ERROR);

          e[name] = 1;
        } else {
          // Don't re-render
          if (e[name] === 0) return e;

          const inputEl = document.getElementsByName(name)[0];
          inputEl?.classList.remove(ClassName.ERROR);

          e[name] = 0;
        }

        return { ...e };
      });
    },
    [ix.name]
  );

  // Gets called in the first render
  const updateTxVals = useCallback(
    (props: updateTxValsProps) => {
      setTxVals((txVals) => {
        const { identifier, k, v, type, kp } = props;

        try {
          const parsedV = PgTest.parse(v, type, idl);

          if (identifier === "args") {
            txVals.args[ix.args.findIndex((arg) => arg.name === k)] = parsedV;
          } else {
            txVals.accs[k] = parsedV;
          }

          // If there is a randomly generated signer
          if (kp) txVals.additionalSigners[k] = kp;
          else if (txVals.additionalSigners[k])
            delete txVals.additionalSigners[k];

          // Remove error from the input
          handleErrors(identifier, k, "remove");
        } catch (e: any) {
          console.log(`${e.message}\nKey: ${k}\nValue: ${v}`);
          // Add error to the input
          handleErrors(identifier, k, "add");
        } finally {
          return txVals;
        }
      });
    },
    [ix.args, idl, handleErrors]
  );

  const { currentWallet } = useCurrentWallet();

  // Test submission
  const handleTest = useCallback(async () => {
    const showLogTxHash = await PgTerminal.process(async () => {
      if (!currentWallet) return;

      setLoading(true);
      PgTerminal.log(PgTerminal.info(`Testing '${ix.name}'...`));

      const preferences = PgPreferences.getPreferences();

      let msg = "";

      try {
        const txHash = await PgCommon.transition(
          PgTest.test(txVals, idl, conn, currentWallet)
        );
        setTxHash(txHash);

        if (preferences.showTxDetailsInTerminal) {
          return txHash;
        }

        const txResult = await PgTx.confirm(txHash, conn);

        if (txResult?.err) {
          msg = `${Emoji.CROSS} ${PgTerminal.error(
            `Test '${ix.name}' failed`
          )}.`;
        } else {
          msg = `${Emoji.CHECKMARK} ${PgTerminal.success(
            `Test '${ix.name}' passed`
          )}.`;
        }

        PgTerminal.log(msg + "\n", { noColor: true });
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        PgTerminal.log(
          `${Emoji.CROSS} ${PgTerminal.error(
            `Test '${ix.name}' failed`
          )}: ${convertedError}\n`,
          { noColor: true }
        );
      } finally {
        setLoading(false);
      }
    });

    if (showLogTxHash) {
      // Wait before confirming the transaction on live clusters
      if (conn.rpcEndpoint.startsWith("https")) {
        await PgCommon.sleep(1500);
      }
      PgTerminal.execute({ solana: `confirm ${showLogTxHash} -v` });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txVals, idl, conn, currentWallet, setTxHash]);

  return (
    <>
      <ArgsAndAccountsWrapper>
        <FnContext.Provider
          value={{
            updateTxVals,
          }}
        >
          {ix.args.length > 0 && (
            <ArgsWrapper>
              <Foldable ClickEl={<ArgsText>Args:</ArgsText>} open>
                {ix.args.map((a, i) => (
                  <Arg
                    key={i}
                    name={a.name}
                    type={PgTest.getFullType(a.type, idl)}
                    functionName={ix.name}
                  />
                ))}
              </Foldable>
            </ArgsWrapper>
          )}
          {ix.accounts.length > 0 && (
            <AccountsWrapper>
              <Foldable ClickEl={<AccountsText>Accounts:</AccountsText>} open>
                {ix.accounts.map((a, i) => (
                  <Account
                    key={i}
                    account={a as IdlAccount}
                    functionName={ix.name}
                  />
                ))}
              </Foldable>
            </AccountsWrapper>
          )}
        </FnContext.Provider>
      </ArgsAndAccountsWrapper>
      <ButtonWrapper>
        <Button
          kind="primary"
          onClick={handleTest}
          disabled={disabled || loading || !currentWallet}
          btnLoading={loading}
        >
          Test
        </Button>
      </ButtonWrapper>
    </>
  );
};

interface InstructionWrapperProps {
  index: number;
}

const InstructionWrapper = styled.div<InstructionWrapperProps>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.border};
    background: ${index % 2 === 0 &&
    theme.components.sidebar.right.default.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.border};
    }
  `}
`;

const InstructionName = styled.span`
  font-weight: bold;
`;

const ArgsAndAccountsWrapper = styled.div`
  padding-left: 0.25rem;

  & > div {
    margin-top: 1rem;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;

  & > button {
    padding: 0.5rem 1.5rem;
  }
`;

const ArgsWrapper = styled.div``;

const ArgsText = styled.span``;

const AccountsWrapper = styled.div``;

const AccountsText = styled.span``;

export default Instruction;
