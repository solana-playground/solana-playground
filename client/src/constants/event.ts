export enum EventName {
  // Client
  CLIENT_RUN = "clientrun",

  // Connection
  CONNECTION_REFRESH = "connectionrefresh",
  CONNECTION_STATIC = "connectionstatic",

  // Editor
  EDITOR_FOCUS = "editorfocus",
  EDITOR_FORMAT = "editorformat",

  // Explorer
  EXPLORER_STATIC = "explorerstatic",
  EXPLORER_ON_DID_SWITCH_FILE = "explorerondidswitchfile",

  // Modal
  MODAL_SET = "modalset",

  // Terminal
  TERMINAL_DISABLE = "terminaldisable",
  TERMINAL_ENABLE = "terminalenable",
  TERMINAL_RUN_CMD_FROM_STR = "terminalruncmdfromstr",
  TERMINAL_RUN_LAST_CMD = "terminalrunlastcmd",
  TERMINAL_SCROLL_TO_BOTTOM = "terminalscrolltobottom",
  TERMINAL_STATE = "terminalstate",
  TERMINAL_STATIC = "terminalstatic",
  TERMINAL_WAIT_FOR_INPUT = "terminalwaitforinput",
  TERMINAL_PROGRESS_SET = "terminalprogressset",

  // Wallet
  WALLET_STATIC = "walletstatic",
}
