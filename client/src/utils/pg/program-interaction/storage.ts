import type { GeneratableInstruction } from "./generator";
import type { IdlInstruction } from "./idl-types";

/** Storage to use for program interactions */
const storage = sessionStorage;

/**
 * Get the instruction from the configured {@link storage}.
 *
 * @param idlIx IDL instruction
 * @returns the saved instruction or `null`
 */
export const getInstruction = (
  idlIx: IdlInstruction
): GeneratableInstruction | null => {
  const savedIx = storage.getItem(getStorageKey(idlIx.name));
  if (savedIx) return { name: idlIx.name, values: JSON.parse(savedIx) };
  return null;
};

/**
 * Save the instruction to the configured {@link storage}.
 *
 * @param ix generatable instruction
 */
export const saveInstruction = (ix: GeneratableInstruction) => {
  storage.setItem(getStorageKey(ix.name), JSON.stringify(ix.values));
};

/** Append a prefix to prevent key collision and return it. */
const getStorageKey = (name: string) => "pi-" + name;
