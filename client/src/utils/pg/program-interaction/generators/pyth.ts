import { PgCommon } from "../../common";
import { Cluster, PgConnection } from "../../connection";

/** Pyth feed accounts per cluster */
const PYTH_ACCOUNTS: {
  /** Map of feed account name -> public key */
  [K in Cluster]?: { [name: string]: string };
} = {};

/**
 * Get or initialize Pyth feed accounts for the current cluster.
 *
 * This function will only fetch the data once per cluster and all subsequent
 * calls can be synchronous via {@link getPythAccounts}.
 *
 * @returns the Pyth feed accounts for the current cluster
 */
export const getOrInitPythAccounts = async () => {
  PYTH_ACCOUNTS[PgConnection.cluster] ??= await PgCommon.fetchJSON(
    `/pyth/${PgConnection.cluster}.json`
  );
  return getPythAccounts();
};

/**
 * Get Pyth accounts for the current cluster.
 *
 * This function requires the {@link getOrInitPythAccounts} function to be called
 * at least once before otherwise it will throw an error.
 *
 * @returns the Pyth feed accounts for the current cluster
 */
export const getPythAccounts = () => {
  const accounts = PYTH_ACCOUNTS[PgConnection.cluster];
  if (accounts) return accounts;
  throw new Error(`Pyth accounts on ${PgConnection.cluster} not found`);
};
