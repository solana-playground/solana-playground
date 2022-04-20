import { createContext, FC, useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Idl, BN } from "@project-serum/anchor";
import { PublicKey, Signer } from "@solana/web3.js";
import { IdlAccount, IdlInstruction } from "@project-serum/anchor/dist/cjs/idl";
import { useConnection } from "@solana/wallet-adapter-react";
import styled, { css } from "styled-components";

import Button from "../../../../Button";
import Foldable from "../../../../Foldable";
import Account from "./Account";
import Arg from "./Arg";
import { getFullType } from "./types";
import { PgTest } from "../../../../../utils/pg/test";
import { updateTxValsProps } from "./useUpdateTxVals";
import { ClassNames } from "../../../../../constants/";
import { terminalAtom } from "../../../../../state";
import useCurrentWallet from "../Wallet/useCurrentWallet";
import { PgTx } from "../../../../../utils/pg/tx";

type KV = {
  [key: string]: string | number | BN | PublicKey | Signer;
};

export interface TxVals {
  name: string;
  accs?: KV;
  args?: KV;
  additionalSigners: KV;
}

interface FnContextProps {
  updateTxVals: (props: updateTxValsProps) => void;
}

export const FnContext = createContext<FnContextProps>({} as FnContextProps);

interface FunctionProps {
  index: number;
  ixs: IdlInstruction;
  idl: Idl;
}

const Function: FC<FunctionProps> = ({ ixs, idl, index }) => {
  const [, setTerminal] = useAtom(terminalAtom);

  const { connection: conn } = useConnection();

  // State
  const [txVals, setTxVals] = useState<TxVals>({
    name: ixs.name,
    additionalSigners: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const handleErrors = useCallback(
    (identifier: string, k: string, action: "add" | "remove") => {
      setErrors((e) => {
        const name = identifier + k;

        if (action === "add") {
          const inputEl = document.getElementsByName(name)[0];
          if (inputEl?.classList.contains(ClassNames.TOUCHED))
            inputEl.classList.add(ClassNames.ERROR);

          e[name] = 1;
        } else {
          // Don't re-render
          if (e[name] === 0) return e;

          const inputEl = document.getElementsByName(name)[0];
          inputEl?.classList.remove(ClassNames.ERROR);

          e[name] = 0;
        }

        return { ...e };
      });
    },
    [setErrors]
  );

  // Set errors
  useEffect(() => {
    let totalErrors = 0;

    for (const name in errors) {
      totalErrors += errors[name];
    }

    if (totalErrors) setDisabled(true);
    else setDisabled(false);
  }, [errors]);

  // Gets called in the first render
  const updateTxVals = useCallback(
    (props: updateTxValsProps) => {
      setTxVals((txVals) => {
        const { identifier, k, v, type, kp } = props;

        try {
          const parsedV = PgTest.validate(v, type);

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
        } catch (e) {
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

    setLoading(true);

    let msg = "";

    try {
      const txHash = await PgTest.test(txVals, idl, conn, currentWallet);

      await PgTx.confirm(
        txHash,
        conn,
        () => (msg = `Test '${ixs.name}' failed. Tx hash: ${txHash}`),
        () => (msg = `Test '${ixs.name}' passed. Tx hash: ${txHash}`)
      );
    } catch (e: any) {
      msg = `Test '${ixs.name}' error: ${e.message}`;
    } finally {
      setTerminal(msg);
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txVals, idl, conn, currentWallet, setTerminal]);

  return (
    <FunctionWrapper index={index}>
      <Foldable ClickEl={() => <FunctionName>{ixs.name}</FunctionName>} closed>
        <ArgsAndAccountsWrapper>
          <FnContext.Provider
            value={{
              updateTxVals,
            }}
          >
            <ArgsWrapper>
              <Foldable ClickEl={() => <ArgsText>Args:</ArgsText>}>
                {ixs.args.map((a, j) => (
                  <Arg
                    key={j}
                    name={a.name}
                    type={getFullType(a.type, idl.types!)}
                  />
                ))}
              </Foldable>
            </ArgsWrapper>
            <AccountsWrapper>
              <Foldable ClickEl={() => <AccountsText>Accounts:</AccountsText>}>
                {ixs.accounts.map((a, j) => (
                  <Account key={j} account={a as IdlAccount} />
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
          >
            Test
          </Button>
        </ButtonWrapper>
      </Foldable>
    </FunctionWrapper>
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
