import { PgLanguage } from "../utils/pg";

export const json = PgLanguage.create({
  name: "JSON",
  extension: "json",
});
