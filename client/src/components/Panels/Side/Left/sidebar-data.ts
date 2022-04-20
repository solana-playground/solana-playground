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
      title: `${Sidebar.BUILD} (Ctrl+Shift+B)`,
      src: rootDir + "build.png",
      value: Sidebar.BUILD,
    },
    {
      title: `${Sidebar.DEPLOY} (Ctrl+Shift+D)`,
      src: rootDir + "deploy.png",
      value: Sidebar.DEPLOY,
    },
    {
      title: `${Sidebar.TEST} (Ctrl+Shift+T)`,
      src: rootDir + "test.png",
      value: Sidebar.TEST,
    },
  ],
  bottom: [
    {
      title: Sidebar.WALLET,
      src: rootDir + "wallet.png",
      value: Sidebar.WALLET,
    },
    {
      title: Sidebar.SETTINGS,
      src: rootDir + "settings.webp",
      value: Sidebar.SETTINGS,
    },
  ],
};
