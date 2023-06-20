import { PgTerminal } from "../../../../terminal";

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
