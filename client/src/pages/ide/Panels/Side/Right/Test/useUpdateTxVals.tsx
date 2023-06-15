import { createContext, useContext, useEffect } from "react";
import { Keypair } from "@solana/web3.js";
import type { IdlType } from "@project-serum/anchor/dist/cjs/idl";

interface IxContextProps {
  updateTxVals: (props: updateTxValsProps) => void;
}

export const IxContext = createContext<IxContextProps>({} as IxContextProps);

export enum Identifiers {
  ARGS = "args",
  ACCS = "accs",
}

export interface updateTxValsProps {
  identifier: Identifiers.ARGS | Identifiers.ACCS;
  k: string;
  v: string;
  type: IdlType;
  kp?: Keypair | null;
}

const useUpdateTxVals = (props: updateTxValsProps) => {
  const { identifier, k, v, type, kp } = props;
  const { updateTxVals } = useContext(IxContext);

  useEffect(() => {
    updateTxVals({ identifier, k, v, type, kp });
  }, [identifier, k, v, type, kp, updateTxVals]);
};

export default useUpdateTxVals;
