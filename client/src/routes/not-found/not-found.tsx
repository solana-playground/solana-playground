import { PgRouter } from "../../utils";
import { handleRoute } from "../common";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: () => handleRoute({ main: "NotFound" }),
});
