import { createContext, FC, useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Idl } from "@project-serum/anchor";
import { IdlAccount, IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { useConnection } from "@solana/wallet-adapter-react";
import styled, { css } from "styled-components";

import Account from "./Account";
import Arg from "./Arg";
import Button from "../../../../Button";
import Foldable from "../../../../Foldable";
import { updateTxValsProps } from "./useUpdateTxVals";
import { ClassName, Emoji } from "../../../../../constants";
import { txHashAtom } from "../../../../../state";
import {
  PgCommon,
  PgPreferences,
  PgTerminal,
  PgTest,
  PgTx,
  TxVals,
} from "../../../../../utils/pg";
import { useCurrentWallet } from "../../../Wallet";

interface FnContextProps {
  updateTxVals: (props: updateTxValsProps) => void;
}

export const FnContext = createContext<FnContextProps>({} as FnContextProps);

interface FunctionProps extends FunctionInsideProps {
  index: number;
}

const Function: FC<FunctionProps> = ({ ixs, idl, index }) => (
  <FunctionWrapper index={index}>
    <Foldable ClickEl={<FunctionName>{ixs.name}</FunctionName>}>
      <FunctionInside idl={idl} ixs={ixs} />
    </Foldable>
  </FunctionWrapper>
);

interface FunctionInsideProps {
  ixs: IdlInstruction;
  idl: Idl;
}

const FunctionInside: FC<FunctionInsideProps> = ({ ixs, idl }) => {
  const [, setTxHash] = useAtom(txHashAtom);

  const { connection: conn } = useConnection();

  // State
  const [txVals, setTxVals] = useState<TxVals>({
    name: ixs.name,
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
    if (!nameCount && ixs.accounts.length) {
      return;
    }

    if (totalErrors) setDisabled(true);
    else setDisabled(false);
  }, [errors, ixs.accounts.length]);

  const handleErrors = useCallback(
    (identifier: string, k: string, action: "add" | "remove") => {
      setErrors((e) => {
        const name = ixs.name + identifier + k;

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
    [ixs.name]
  );

  // Gets called in the first render
  const updateTxVals = useCallback(
    (props: updateTxValsProps) => {
      setTxVals((txVals) => {
        const { identifier, k, v, type, kp } = props;

        try {
          const parsedV = PgTest.parse(v, type);

          if (identifier === "args") {
            txVals.args[ixs.args.findIndex((arg) => arg.name === k)] = parsedV;
          } else {
            txVals.accs[k] = parsedV;
          }

          // If there is a randomly generated signer
          if (kp) txVals.additionalSigners[k] = kp;
          else if (txVals.additionalSigners[k])
            delete txVals.additionalSigners[k];

          // Remove error from the input
          handleErrors(identifier, k, "remove");
        } catch {
          // Add error to the input
          handleErrors(identifier, k, "add");
        } finally {
          return txVals;
        }
      });
    },
    [ixs.args, handleErrors]
  );

  const { currentWallet } = useCurrentWallet();

  // Test submission
  const handleTest = useCallback(async () => {
    const showLogTxHash = await PgTerminal.runCmd(async () => {
      if (!currentWallet) return;

      setLoading(true);
      PgTerminal.log(PgTerminal.info(`Testing '${ixs.name}'...`));

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
            `Test '${ixs.name}' failed`
          )}.`;
        } else {
          msg = `${Emoji.CHECKMARK} ${PgTerminal.success(
            `Test '${ixs.name}' passed`
          )}.`;
        }

        PgTerminal.log(msg + "\n", { noColor: true });
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        PgTerminal.log(
          `${Emoji.CROSS} ${PgTerminal.error(
            `Test '${ixs.name}' failed`
          )}: ${convertedError}\n`,
          { noColor: true }
        );
      } finally {
        setLoading(false);
      }
    });

    if (showLogTxHash) {
      await PgCommon.sleep(1000);
      PgTerminal.runCmdFromStr(`solana confirm ${showLogTxHash} -v`);
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
          {ixs.args.length > 0 && (
            <ArgsWrapper>
              <Foldable ClickEl={<ArgsText>Args:</ArgsText>} open>
                {ixs.args.map((a, i) => (
                  <Arg
                    key={i}
                    name={a.name}
                    type={PgTest.getFullType(a.type, idl.types, idl.accounts)}
                    functionName={ixs.name}
                  />
                ))}
              </Foldable>
            </ArgsWrapper>
          )}
          {ixs.accounts.length > 0 && (
            <AccountsWrapper>
              <Foldable ClickEl={<AccountsText>Accounts:</AccountsText>} open>
                {ixs.accounts.map((a, i) => (
                  <Account
                    key={i}
                    account={a as IdlAccount}
                    functionName={ixs.name}
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

interface FunctionWrapperProps {
  index: number;
}

const FunctionWrapper = styled.div<FunctionWrapperProps>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.borderColor};
    background-color: ${index % 2 === 0 && theme.colors.right?.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }
  `}
`;

const FunctionName = styled.span`
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

export default Function;
