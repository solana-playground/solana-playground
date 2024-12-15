import { PgRouter } from "../utils/pg";
import { handleRoute } from "./utils";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) => {
    return handleRoute({
      getMain: async () => {
        const { NotFound } = await import("../views/main/primary/NotFound");
        return <NotFound path={invalidPath} />;
      },
    });
  },
});
