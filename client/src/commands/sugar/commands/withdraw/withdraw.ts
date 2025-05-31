import { Metaplex } from "@metaplex-foundation/js";

import { getMetaplex } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgCommon, PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processWithdraw = async (
  candyMachine: string | undefined,
  rpcUrl: string | undefined,
  list: boolean
) => {
  // (1) Setting up connection
  const term = await PgTerminal.get();
  term.println(`[1/2] ${Emoji.COMPUTER} Initializing connection`);

  const metaplex = await getMetaplex(rpcUrl);

  term.println(
    `\n[2/2] ${Emoji.WITHDRAW} ${list ? "Listing" : "Retrieving"} funds`
  );

  // the --list flag takes precedence; even if a candy machine id is passed
  // as an argument, we will list the candy machines (no draining happens)
  const candyMachinePkStr = list ? null : candyMachine;

  // (2) Retrieving data for listing/draining
  if (candyMachinePkStr) {
    const candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);

    await doWithdraw(metaplex, candyMachinePk);
  } else {
    const candyAccounts = await metaplex.connection.getProgramAccounts(
      metaplex.programs().getCandyMachine().address,
      {
        filters: [
          {
            memcmp: {
              offset: 16, // authority
              bytes: metaplex.identity().publicKey.toString(),
            },
          },
        ],
        encoding: "base64",
        commitment: "confirmed",
      }
    );

    const totalLamports = candyAccounts.reduce(
      (acc, cur) => acc + cur.account.lamports,
      0
    );

    term.println(
      `\nFound ${candyAccounts.length} candy machine(s), total amount: ${
        Emoji.SOL
      } ${totalLamports / PgWeb3.LAMPORTS_PER_SOL}`,
      { noColor: true }
    );

    if (candyAccounts.length) {
      if (list) {
        term.println(
          `\n${PgCommon.string("Candy Machine ID", {
            addSpace: { amount: 48, position: "right" },
          })} Balance`
        );
        term.println(PgCommon.string("-", { repeat: { amount: 61 } }));

        for (const accountInfo of candyAccounts) {
          term.println(
            `${PgCommon.string(accountInfo.pubkey.toBase58(), {
              addSpace: { amount: 48, position: "right" },
            })} ${PgCommon.string(
              (
                accountInfo.account.lamports / PgWeb3.LAMPORTS_PER_SOL
              ).toString(),
              { addSpace: { amount: 8 } }
            )}`
          );
        }
      } else {
        term.println(
          PgTerminal.warning(
            [
              "\n+-----------------------------------------------------+",
              `| ${Emoji.WARNING} WARNING: This will drain ALL your Candy Machines |`,
              "+-----------------------------------------------------+",
            ].join("\n")
          ),
          { noColor: true }
        );

        if (
          !(await term.waitForUserInput("Do you want to continue?", {
            confirm: true,
            default: "yes",
          }))
        ) {
          throw new Error("Withdraw aborted");
        }

        let notDrained = 0;
        const errors = [];
        for (const candyAccount of candyAccounts) {
          try {
            await doWithdraw(metaplex, candyAccount.pubkey);
          } catch (e: any) {
            notDrained++;
            errors.push({
              candyMachine: candyAccount.pubkey.toBase58(),
              message: e.message,
            });
          }
        }

        if (notDrained) {
          term.println(
            PgTerminal.error(`Could not drain ${notDrained} candy machine(s)`)
          );
          term.println(PgTerminal.error(`Errors:`));
          for (const error of errors) {
            term.println(
              `${PgTerminal.bold("Candy Machine:")} ${PgTerminal.error(
                error.candyMachine
              )}\n${PgTerminal.bold("Error:")} ${PgTerminal.error(
                error.message
              )}`,
              { noColor: true }
            );
          }
        }
      }
    }
  }
};

const doWithdraw = async (
  metaplex: Metaplex,
  candyMachinePk: PgWeb3.PublicKey
) => {
  await metaplex.candyMachines().delete({ candyMachine: candyMachinePk });
};
