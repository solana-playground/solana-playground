import { Sidebar, SidebarData } from "../../../../../utils/pg";

const getImgSrc = (name: string) => "/icons/sidebar/" + name;

export const sidebarData: SidebarData = {
  top: [
    {
      title: `${Sidebar.EXPLORER} (Ctrl+Shift+E)`,
      src: getImgSrc("explorer.webp"),
      value: Sidebar.EXPLORER,
    },
    // {
    //   title: `${Sidebar.SEARCH} (Ctrl+Shift+F)`,
    //   src: getImgSrc("search.png"),
    //   value: Sidebar.SEARCH,
    // },
    {
      title: `${Sidebar.BUILD_DEPLOY} (Ctrl+Shift+B)`,
      src: getImgSrc("build.png"),
      value: Sidebar.BUILD_DEPLOY,
    },
    {
      title: `${Sidebar.TEST} (Ctrl+Shift+D)`,
      src: getImgSrc("test.png"),
      value: Sidebar.TEST,
    },
    {
      title: `${Sidebar.TUTORIALS} (Ctrl+Shift+L)`,
      src: getImgSrc("tutorials.webp"),
      value: Sidebar.TUTORIALS,
    },
  ],
  bottom: [
    {
      title: Sidebar.GITHUB,
      src: getImgSrc("github.png"),
      value: Sidebar.GITHUB,
    },
    {
      title: Sidebar.SETTINGS,
      src: getImgSrc("settings.webp"),
      value: Sidebar.SETTINGS,
    },
  ],
};
