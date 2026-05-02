import { LAMPORTS_PER_SOL } from "./web3";

/**
 * @returns lamports amount to equivalent Sol
 */
export const lamportsToSol = (lamports: number) => {
  return lamports / LAMPORTS_PER_SOL;
};

/**
 * @returns Sol amount to equivalent lamports
 */
export const solToLamports = (sol: number) => {
  return sol * LAMPORTS_PER_SOL;
};
