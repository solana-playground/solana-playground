import {
  CallableJSX,
  Disposable,
  NullableJSX,
  PgCommon,
  PgExplorer,
  PgRouter,
  PgView,
  Promisable,
  SyncOrAsync,
} from "../utils/pg";

type ComponentName =
  | string
  | { name: string; props?: Promisable<Record<string, any>> };

/** Handle routes conveniently. */
export const handleRoute = (
  params: {
    /** Get primary main view component/element. */
    main?: ComponentName | (() => Promise<NullableJSX | CallableJSX>);
    /** Sidebar page to set */
    // TODO: Make it work with `SidebarPageName` (doesn't work due to circularity)
    sidebar?: ComponentName;
    /** Whether to minimize secondary main view */
    minimizeSecondaryMainView?: boolean;
    /** Get custom explorer initialization arguments. */
    getExplorerInitArg?: () => SyncOrAsync<
      Parameters<typeof PgExplorer["init"]>[0]
    >;
  } = {}
): Disposable => {
  const {
    main: _main,
    sidebar: _sidebar,
    minimizeSecondaryMainView,
    getExplorerInitArg,
  } = params;
  const main = _main
    ? typeof _main === "string"
      ? { name: _main }
      : _main
    : { name: "Default" };
  const sidebar = _sidebar
    ? typeof _sidebar === "string"
      ? { name: _sidebar as SidebarPageName }
      : { ..._sidebar, name: _sidebar.name as SidebarPageName }
    : null;

  // Set primary main view
  PgView.setMainPrimary(async () => {
    try {
      PgView.setSidebarLoading(true);

      // Initialize explorer
      const explorerInitArg = await getExplorerInitArg?.();
      await PgExplorer.init(explorerInitArg);

      // Set sidebar page
      if (sidebar) PgView.setSidebarPage(sidebar.name);
      if (sidebar?.props) {
        const sidebarProps = await PgCommon.callIfNeeded(sidebar.props);
        PgView.setSidebarPageProps(sidebarProps);
      }

      // Get/import main
      switch (typeof main) {
        case "function":
          return main();
        case "object":
          const { default: Main } = await import(
            "../views/main/primary/" + main.name
          );
          const props = await PgCommon.callIfNeeded(main.props);
          return <Main {...props} />;
        default:
          throw new Error("Invalid `main` prop on route handler" + main);
      }
    } finally {
      PgView.setSidebarLoading(false);
    }
  });

  // Handle clicking on non-routed sidebar pages
  const sidebarRoute = sidebar && PgView.getSidebarPage(sidebar.name).route;
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
          if (page === sidebar.name) return "Explorer";
          return page;
        });
      }

      // Set the main secondary view height to the previous saved value
      mainSecondaryHeightChange?.dispose();
    },
  };
};
