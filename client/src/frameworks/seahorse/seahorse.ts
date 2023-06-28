import { Lang, PgFramework } from "../../utils/pg";

export const seahorse = PgFramework.create({
  name: "Seahorse",
  language: Lang.PYTHON,
  src: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
  circleImage: true,
  importFiles: () => import("./files"),
});
