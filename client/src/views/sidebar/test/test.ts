import TestSkeleton from "./Test/TestSkeleton";
import { PgView } from "../../../utils/pg";

export const test = PgView.createSidebarPage({
  name: "Test",
  icon: "test.png",
  importElement: () => import("./Test"),
  LoadingElement: TestSkeleton,
  keybind: "Ctrl+Shift+D",
});
