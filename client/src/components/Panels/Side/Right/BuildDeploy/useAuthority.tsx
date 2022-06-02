import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { PgProgramInfo, PgWallet } from "../../../../../utils/pg";
import { refreshProgramIdAtom } from "../../../../../state";

interface ProgramData {
  upgradeable: boolean;
  authority?: PublicKey;
}

const useAuthority = () => {
  // To re-render if user changes program id
  const [programIdCount] = useAtom(refreshProgramIdAtom);

  const { connection: conn } = useConnection();

  const [programData, setProgramData] = useState<ProgramData>({
    upgradeable: true,
  });

  useEffect(() => {
    const handleClick = async () => {
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
        console.log(e.message);
      }
    };

    handleClick();
  }, [conn, programIdCount]);

  return {
    hasAuthority:
      programData.authority &&
      programData.authority.equals(PgWallet.getKp().publicKey),
    upgradeable: programData.upgradeable,
  };
};

export default useAuthority;
