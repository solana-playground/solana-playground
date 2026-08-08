import { PgRouter } from "../../utils";
import { handleRoute } from "../common";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) =>
    handleRoute({
      main: {
        name: "Error",
        props: { text: `URL path not found: ${invalidPath}` },
      },
    }),
});
