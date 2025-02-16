import {
  CallableJSX,
  Disposable,
  NullableJSX,
  PgExplorer,
  PgRouter,
  PgView,
  SyncOrAsync,
} from "../utils/pg";

/** Handle routes conveniently. */
export const handleRoute = (params: {
  /** Get primary main view component/element. */
  main?: string | (() => Promise<NullableJSX | CallableJSX>);
  /** Sidebar page to set */
  // TODO: Make it work with `SidebarPageName` (doesn't work due to circularity)
  sidebar?: string;
  /** Whether to minimize secondary main view */
  minimizeSecondaryMainView?: boolean;
  /** Get custom explorer initialization arguments. */
  getExplorerInitArg?: () => SyncOrAsync<
    Parameters<typeof PgExplorer["init"]>[0]
  >;
}): Disposable => {
  const {
    main,
    sidebar: _sidebar,
    minimizeSecondaryMainView,
    getExplorerInitArg,
  } = params;
  const sidebar = _sidebar as SidebarPageName | undefined;

  // Set primary main view
  PgView.setMainPrimary(async () => {
    try {
      PgView.setSidebarLoading(true);

      // Initialize explorer
      const explorerInitArg = await getExplorerInitArg?.();
      await PgExplorer.init(explorerInitArg);

      // Set sidebar page
      if (sidebar) PgView.setSidebarPage(sidebar);

      // Get/import main
      if (typeof main === "function") return main();

      const mod = await import(
        "../views/main/primary/" + (main ?? "EditorWithTabs")
      );
      const Main = Object.values<CallableJSX>(mod)[0];
      return <Main />;
    } finally {
      PgView.setSidebarLoading(false);
    }
  });

  // Handle clicking on non-routed sidebar pages
  const sidebarRoute = sidebar && PgView.getSidebarPage(sidebar).route;
  const sidebarPageChange = sidebarRoute
    ? PgView.onDidChangeSidebarPage((page) => {
        if (!page.route) PgRouter.navigate();
      })
    : null;

  // Minimize secondary main view and reopen on navigation to other routes
  let mainSecondaryHeightChange: Disposable | undefined;
  if (minimizeSecondaryMainView) {
    let oldHeight = 0;
    PgView.setMainSecondaryHeight((h) => {
      oldHeight = h;
      return 0;
    });

    mainSecondaryHeightChange = {
      dispose: () => PgView.setMainSecondaryHeight(oldHeight),
    };
  }

  return {
    dispose: () => {
      sidebarPageChange?.dispose();

      // Only change sidebar page when going outside of `/${path}`
      if (
        sidebarRoute &&
        !PgRouter.location.pathname.startsWith(sidebarRoute)
      ) {
        // This fixes the case where going back from `/${path}` to `/` with
        // browser's navigations would cause incorrect component to still be
        // mounted instead of switching to `Explorer`
        PgView.setSidebarPage((page) => {
          if (page === sidebar) return "Explorer";
          return page;
        });
      }

      // Set the main secondary view height to the previous saved value
      mainSecondaryHeightChange?.dispose();
    },
  };
};
