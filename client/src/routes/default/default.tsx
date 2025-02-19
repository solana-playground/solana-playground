import { PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const defaultRoute = PgRouter.create({
  path: "/",
  handle: () => handleRoute(),
});
