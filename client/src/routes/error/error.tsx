import { PgRouter } from "../../utils";
import { handleRoute } from "../common";

export const error = PgRouter.create({
  path: "/error/{path}",
  handle: ({ path }) =>
    handleRoute({
      main: {
        name: "Error",
        props: {
          text: `Unexpected error occured in path: ${path}`,
          navigation: { name: "Go back", path },
        },
      },
    }),
});
