import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const seahorse = createFramework({
  name: "Seahorse",
  language: Lang.PYTHON,
  src: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
  circleImage: true,
});
