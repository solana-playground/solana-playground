import { PgRouter } from "../../utils";
import { handleRoute } from "../common";

export const defaultRoute = PgRouter.create({
  path: "/",
  handle: () => handleRoute(),
});
