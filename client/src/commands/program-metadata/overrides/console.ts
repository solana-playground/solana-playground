import { PgTerminal } from "../../../utils";

export const log = PgTerminal.println;

// TODO: Real table impl
export const table = PgTerminal.formatList;
