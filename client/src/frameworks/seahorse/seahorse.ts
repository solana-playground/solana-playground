import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const seahorse = createFramework({
  name: "Seahorse",
  language: Lang.PYTHON,
  icon: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
  circleImage: true,
  getIsCurrent: (files) => {
    for (const path in files) {
      const isSeahorse = files[path].content?.includes("seahorse.prelude");
      if (isSeahorse) return true;
    }

    return false;
  },
});
