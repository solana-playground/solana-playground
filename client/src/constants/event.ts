export enum EventName {
  // Editor
  EDITOR_FOCUS = "editorfocus",
  EDITOR_FORMAT = "editorformat",

  // Playnet
  PLAYNET_ON_DID_INIT = "playnetondidinit",

  // Router
  ROUTER_NAVIGATE = "routernavigate",
  ROUTER_ON_DID_CHANGE_PATH = "routerondidchangepath",
  ROUTER_ON_DID_CHANGE_HASH = "routerondidchangehash",

  // Terminal
  TERMINAL_STATIC = "terminalstatic",
  TERMINAL_PROGRESS_SET = "terminalprogressset",

  // Theme
  THEME_SET = "themeset",
  THEME_FONT_SET = "fontset",
}
