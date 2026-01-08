import {
  Disposable,
  Elementable,
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
    main?: ComponentName | (() => Promise<Elementable>);
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

  const disposables: Disposable[] = [];

  // Set primary main view
  PgView.setMainPrimary(async () => {
    try {
      PgView.setSidebarLoading(true);

      // Initialize explorer
      const explorerInitArg = await getExplorerInitArg?.();
      await PgExplorer.init(explorerInitArg);

      // Set sidebar page
      if (sidebar) {
        PgView.sidebar.name = sidebar.name;

        if (sidebar.props) {
          const sidebarProps = await PgCommon.callIfNeeded(sidebar.props);
          PgView.sidebar.props = { ...sidebarProps, pageName: sidebar.name };
          disposables.push({ dispose: () => (PgView.sidebar.props = {}) });
        }
      } else if (!PgView.sidebar.name) {
        PgView.sidebar.name = "Explorer";
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

  const sidebarRoute =
    sidebar &&
    PgView.allSidebarPages.find((p) => p.name === sidebar.name)!.route;
  if (sidebarRoute) {
    disposables.push(
      // Handle clicking on non-routed sidebar pages
      PgView.onDidChangeCurrentSidebarPage((page) => {
        if (page && !page.route) PgRouter.navigate();
      }),

      // Only change sidebar page when going outside of `/${path}`
      {
        dispose: () => {
          if (
            !PgRouter.location.pathname.startsWith(sidebarRoute) &&
            PgView.sidebar.name === sidebar.name
          ) {
            // This fixes the case where going back from `/${path}` to `/` with
            // browser's navigations would cause incorrect component to still be
            // mounted instead of switching to `Explorer`
            PgView.sidebar.name = "Explorer";
          }
        },
      }
    );
  }

  // Minimize secondary main view and reopen on navigation to other routes
  if (minimizeSecondaryMainView) {
    let oldHeight = 0;
    PgView.setMainSecondaryHeight((h) => {
      oldHeight = h;
      return 0;
    });

    // Set the main secondary view height to the previous saved value
    disposables.push({
      dispose: () => PgView.setMainSecondaryHeight(oldHeight),
    });
  }

  return {
    dispose: () => disposables.forEach(({ dispose }) => dispose()),
  };
};
