import { PgRouter, PgShare } from "../../utils";
import { handleRoute } from "../common";

export const share = PgRouter.create({
  path: "/{shareId}",
  validate: ({ shareId }) => PgShare.isValidId(shareId),
  handle: ({ shareId }) => {
    return handleRoute({
      getExplorerInitArg: async () => ({ files: await PgShare.get(shareId) }),
    });
  },
});
