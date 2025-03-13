import { PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) => {
    return handleRoute({
      main: { name: "NotFound", props: { path: invalidPath } },
    });
  },
});
