import { PgRouter } from "../utils/pg";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) => {
    console.log(`Path '${invalidPath}' not found`);
    PgRouter.navigate();
  },
});
