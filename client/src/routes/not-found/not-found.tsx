import { PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: () => handleRoute({ main: "NotFound" }),
});
