import TestSkeleton from "./Component/TestSkeleton";
import { createSidebarPage } from "../create";

export const test = createSidebarPage({
  name: "Test",
  icon: "test.png",
  keybind: "Ctrl+Shift+D",
  LoadingElement: TestSkeleton,
});
