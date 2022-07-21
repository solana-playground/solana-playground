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
import { ClassName } from "../../../../../constants";
import { terminalOutputAtom, txHashAtom } from "../../../../../state";
import {
  PgCommon,
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
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setTxHash] = useAtom(txHashAtom);

  const { connection: conn } = useConnection();

  // State
  const [txVals, setTxVals] = useState<TxVals>({
    name: ixs.name,
    additionalSigners: {},
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
    if (!nameCount) return;

    if (totalErrors) setDisabled(true);
    else setDisabled(false);
  }, [errors]);

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
    [ixs.name, setErrors]
  );

  // Gets called in the first render
  const updateTxVals = useCallback(
    (props: updateTxValsProps) => {
      setTxVals((txVals) => {
        const { identifier, k, v, type, kp } = props;

        try {
          const parsedV = PgTest.parse(v, type);

          if (identifier === "args") {
            let args = txVals.args ?? {};
            args[k] = parsedV;
            txVals.args = args;
          } else {
            let accs = txVals.accs ?? {};
            accs[k] = parsedV;
            txVals.accs = accs;
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
    [setTxVals, handleErrors]
  );

  const { currentWallet } = useCurrentWallet();

  // Test submission
  const handleTest = useCallback(async () => {
    if (!currentWallet) return;

    PgTerminal.disable();

    setLoading(true);

    setTerminal(PgTerminal.info(`Testing '${ixs.name}'...`));
    let msg = "";

    try {
      await PgCommon.sleep(PgCommon.TRANSITION_SLEEP); // To smooth out button transition
      const txHash = await PgTest.test(txVals, idl, conn, currentWallet);
      setTxHash(txHash);

      const txResult = await PgTx.confirm(txHash, conn);

      if (txResult?.err)
        msg = `${PgTerminal.CROSS}  Test '${ixs.name}' ${PgTerminal.error(
          "failed"
        )}.`;
      else
        msg = `${PgTerminal.CHECKMARK}  Test '${ixs.name}' ${PgTerminal.success(
          "passed"
        )}.`;
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `${PgTerminal.CROSS}  Test '${ixs.name}' ${PgTerminal.error(
        "failed"
      )}: ${convertedError}`;
    } finally {
      setTerminal(msg + "\n");
      setLoading(false);
      PgTerminal.enable();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txVals, idl, conn, currentWallet, setTerminal]);

  return (
    <>
      <ArgsAndAccountsWrapper>
        <FnContext.Provider
          value={{
            updateTxVals,
          }}
        >
          {ixs.args.length ? (
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
          ) : null}
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
