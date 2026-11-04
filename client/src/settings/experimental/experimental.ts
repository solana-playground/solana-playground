import { createSetting } from "../create";

export const experimental = [
  createSetting({
    id: "experimental.unstable",
    description:
      "Whether to enable unstable features such as new Anchor versions, " +
      "Pinocchio and Quasar support, installing packages from NPM, and more",
    default: process.env.NODE_ENV !== "production",
  }),
];
