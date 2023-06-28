import { Lang, PgFramework } from "../../utils/pg";

export const anchor = PgFramework.create({
  name: "Anchor",
  language: Lang.RUST,
  src: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
  importFiles: () => import("./files"),
});
