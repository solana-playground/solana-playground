import { PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) => {
    return handleRoute({
      main: async () => {
        const { NotFound } = await import("../../views/main/primary/NotFound");
        return <NotFound path={invalidPath} />;
      },
    });
  },
});
