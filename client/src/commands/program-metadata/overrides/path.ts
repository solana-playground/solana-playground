import { PgCommon, PgExplorer } from "../../../utils";

export const join = PgCommon.joinPaths;

export const dirname = (path: string) => {
  return PgExplorer.getItemNameFromPath(PgExplorer.getParentPathFromPath(path));
};

export const extname = (path: string) => {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const lastDotIndex = base.lastIndexOf(".");
  if (lastDotIndex <= 0) return "";
  return base.slice(lastDotIndex);
};
