import { PgLanguage } from "../utils/pg";

export const rust = PgLanguage.create({
  name: "Rust",
  extension: "rs",
});
