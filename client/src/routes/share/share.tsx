import { PgRouter, PgShare } from "../../utils/pg";
import { handleRoute } from "../common";

export const share = PgRouter.create({
  path: "/{shareId}",
  validate: ({ shareId }) => PgShare.isValidId(shareId),
  handle: ({ shareId }) => {
    return handleRoute({
      getMain: async () => {
        const { EditorWithTabs } = await import(
          "../../views/main/primary/EditorWithTabs"
        );
        return EditorWithTabs;
      },
      getExplorerInitArg: async () => ({ files: await PgShare.get(shareId) }),
    });
  },
});
