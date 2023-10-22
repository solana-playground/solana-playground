import { PgProgramInfo } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";
import { useWallet } from "./useWallet";

export const useProgramInfo = () => {
  useRenderOnChange(PgProgramInfo.onDidChange);

  const { wallet } = useWallet();

  return {
    error: !PgProgramInfo.onChain,
    deployed: PgProgramInfo.onChain?.deployed,
    upgradable: PgProgramInfo.onChain?.upgradable,
    hasAuthority: wallet
      ? PgProgramInfo.onChain?.authority?.equals(wallet.publicKey)
      : false,
    hasProgramKp: !!PgProgramInfo.kp,
    hasUuid: !!PgProgramInfo.uuid,
    importedProgram: PgProgramInfo.importedProgram,
  };
};
