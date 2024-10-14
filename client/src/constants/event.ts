export enum EventName {
  // Editor
  EDITOR_FOCUS = "editorfocus",
  EDITOR_FORMAT = "editorformat",

  // Modal
  MODAL_SET = "modalset",

  // Playnet
  PLAYNET_ON_DID_INIT = "playnetondidinit",

  // Router
  ROUTER_NAVIGATE = "routernavigate",
  ROUTER_LOCATION = "routerlocation",
  ROUTER_ON_DID_CHANGE_PATH = "routerondidchangepath",

  // Terminal
  TERMINAL_STATIC = "terminalstatic",
  TERMINAL_PROGRESS_SET = "terminalprogressset",

  // Theme
  THEME_SET = "themeset",
  THEME_FONT_SET = "fontset",

  // Toast
  TOAST_SET = "toastset",
  TOAST_CLOSE = "toastclose",

  // View
  VIEW_MAIN_PRIMARY_STATIC = "viewmainprimarystatic",
  VIEW_MAIN_SECONDARY_HEIGHT_SET = "viewmainsecondaryheightset",
  VIEW_NEW_ITEM_PORTAL_SET = "viewnewitemportalset",
  VIEW_SIDEBAR_STATE_SET = "viewsidebarstateset",
  VIEW_SIDEBAR_LOADING_SET = "viewsidebarloadingset",
  VIEW_ON_DID_CHANGE_SIDEBAR_PAGE = "viewondidchangesidebarpage",
}
