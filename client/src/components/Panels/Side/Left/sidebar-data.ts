import { Sidebar } from "../sidebar-state";

const ROOT_DIR = "icons/sidebar/";

export const sidebarData = {
  top: [
    {
      title: `${Sidebar.EXPLORER} (Ctrl+Shift+E)`,
      src: ROOT_DIR + "explorer.webp",
      value: Sidebar.EXPLORER,
    },
    // {
    //   title: `${Sidebar.SEARCH} (Ctrl+Shift+F)`,
    //   src: ROOT_DIR + "search.png",
    //   value: Sidebar.SEARCH,
    // },
    {
      title: `${Sidebar.BUILD_DEPLOY} (Ctrl+Shift+B)`,
      src: ROOT_DIR + "build.png",
      value: Sidebar.BUILD_DEPLOY,
    },
    {
      title: `${Sidebar.TEST} (Ctrl+Shift+D)`,
      src: ROOT_DIR + "test.png",
      value: Sidebar.TEST,
    },
  ],
  bottom: [
    {
      title: Sidebar.GITHUB,
      src: ROOT_DIR + "github.png",
      value: Sidebar.GITHUB,
    },
    {
      title: Sidebar.SETTINGS,
      src: ROOT_DIR + "settings.webp",
      value: Sidebar.SETTINGS,
    },
  ],
};
