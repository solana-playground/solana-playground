import { PgGithub, PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const githubDefault = PgRouter.create({
  path: "/{githubUrl}",
  validate: ({ githubUrl }) => PgGithub.isValidUrl(githubUrl),
  handle: ({ githubUrl }) => {
    return handleRoute({
      getExplorerInitArg: async () => ({
        files: await PgGithub.getFiles(githubUrl),
      }),
    });
  },
});

export const github = PgRouter.create({
  path: "/github/{url}",
  handle: ({ url }) => {
    // Redirect to `/{githubUrl}`
    PgRouter.navigate(url);
  },
});
