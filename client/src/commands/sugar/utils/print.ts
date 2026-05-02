import { PgTerminal } from "../../../utils";

export const printWithStyle = (
  indent: string,
  key: string | number,
  value: any = ""
) => {
  PgTerminal.println(
    ` ${PgTerminal.secondaryText(`${indent}:.. ${key}:`)} ${value}`,
    { noColor: true }
  );
};
