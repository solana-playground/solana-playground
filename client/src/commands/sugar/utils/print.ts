import { PgTerminal } from "../../../utils/pg";

export const printWithStyle = (
  indent: string,
  key: string | number,
  value: any = ""
) => {
  PgTerminal.log(
    ` ${PgTerminal.secondaryText(`${indent}:.. ${key}:`)} ${value}`,
    { noColor: true }
  );
};
