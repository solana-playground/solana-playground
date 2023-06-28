import { Lang, PgFramework } from "../../utils/pg";

export const native = PgFramework.create({
  name: "Native",
  language: Lang.RUST,
  src: "/icons/platforms/solana.png",
  importFiles: () => import("./files"),
});
