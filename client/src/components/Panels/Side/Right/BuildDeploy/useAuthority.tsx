import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { PublicKey } from "@solana/web3.js";

import { PgConnection, PgProgramInfo, PgWallet } from "../../../../../utils/pg";
import { refreshProgramIdAtom } from "../../../../../state";
import { usePgConnection } from "../../../../../hooks";

interface ProgramData {
  upgradeable: boolean;
  authority?: PublicKey;
}

export const useAuthority = () => {
  // To re-render if user changes program id
  const [programIdCount] = useAtom(refreshProgramIdAtom);

  const { connection: conn } = usePgConnection();

  const [programData, setProgramData] = useState<ProgramData>({
    upgradeable: true,
  });

  useEffect(() => {
    (async () => {
      if (!PgConnection.isReady(conn)) return;

      const programPk = PgProgramInfo.getPk()?.programPk;
      if (!programPk) return;

      try {
        const programAccountInfo = await conn.getAccountInfo(programPk);
        const programDataPkBuffer = programAccountInfo?.data.slice(4);
        if (!programDataPkBuffer) {
          setProgramData({ upgradeable: true });
          return;
        }
        const programDataPk = new PublicKey(programDataPkBuffer);

        const programDataAccountInfo = await conn.getAccountInfo(programDataPk);

        // Check if program authority exists
        const authorityExists = programDataAccountInfo?.data.at(12);
        if (!authorityExists) {
          setProgramData({ upgradeable: false });
          return;
        }

        const upgradeAuthorityPkBuffer = programDataAccountInfo?.data.slice(
          13,
          45
        );

        const upgradeAuthorityPk = new PublicKey(upgradeAuthorityPkBuffer!);

        setProgramData({ authority: upgradeAuthorityPk, upgradeable: true });
      } catch (e: any) {
        console.log("Could not get authority:", e.message);
      }
    })();
  }, [conn, programIdCount]);

  return {
    authority: programData.authority,
    hasAuthority:
      programData.authority &&
      programData.authority.equals(PgWallet.getKp().publicKey),
    upgradeable: programData.upgradeable,
  };
};
