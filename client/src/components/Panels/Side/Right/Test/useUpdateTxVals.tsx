import { IdlType } from "@project-serum/anchor/dist/cjs/idl";
import { Keypair } from "@solana/web3.js";
import { useContext, useEffect } from "react";
import { FnContext } from "./Function";

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
  const { updateTxVals } = useContext(FnContext);

  useEffect(() => {
    updateTxVals({ identifier, k, v, type, kp });
  }, [identifier, k, v, type, kp, updateTxVals]);
};

export default useUpdateTxVals;
