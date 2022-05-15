import { Sidebar } from "../sidebar-values";

const rootDir = "icons/sidebar/";

export const sidebarData = {
  top: [
    {
      title: `${Sidebar.EXPLORER} Ctrl+Shift+E)`,
      src: rootDir + "explorer.webp",
      value: Sidebar.EXPLORER,
    },
    // {
    //   title: `${Sidebar.SEARCH} (Ctrl+Shift+F)`,
    //   src: rootDir + "search.png",
    //   value: Sidebar.SEARCH,
    // },
    {
      title: `${Sidebar.BUILD_DEPLOY} (Ctrl+Shift+B)`,
      src: rootDir + "build.png",
      value: Sidebar.BUILD_DEPLOY,
    },
    {
      title: `${Sidebar.TEST} (Ctrl+Shift+D)`,
      src: rootDir + "test.png",
      value: Sidebar.TEST,
    },
  ],
  bottom: [
    {
      title: Sidebar.GITHUB,
      src: rootDir + "github.png",
      value: Sidebar.GITHUB,
    },
    {
      title: Sidebar.SETTINGS,
      src: rootDir + "settings.webp",
      value: Sidebar.SETTINGS,
    },
  ],
};
