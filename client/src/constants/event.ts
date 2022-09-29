export enum EventName {
  // Client
  CLIENT_RUN = "clientrun",

  // Connection
  CONNECTION_REFRESH = "connectionrefresh",

  // Editor
  EDITOR_FOCUS = "editorfocus",
  EDITOR_FORMAT = "editorformat",

  // Explorer
  EXPLORER_GET = "explorerget",
  EXPLORER_RUN = "explorerrun",

  // Terminal
  TERMINAL_DISABLE = "terminaldisable",
  TERMINAL_ENABLE = "terminalenable",
  TERMINAL_LOAD_PKG = "terminalloadpkg",
  TERMINAL_LOG = "terminallog",
  TERMINAL_RUN_CMD_FROM_STR = "terminalruncmdfromstr",
  TERMINAL_RUN_LAST_CMD = "terminalrunlastcmd",
  TERMINAL_SCROLL_TO_BOTTOM = "terminalscrolltobottom",
  TERMINAL_STATE = "terminalstate",
}
