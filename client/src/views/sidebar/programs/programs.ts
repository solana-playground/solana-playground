import ProgramsSkeleton from "./Component/ProgramsSkeleton";
import { createSidebarPage } from "../create";

export const programs = createSidebarPage({
  name: "Programs",
  icon: "program.png",
  keybind: "Ctrl+Shift+P",
  route: "/programs",
  LoadingComponent: ProgramsSkeleton,
});
