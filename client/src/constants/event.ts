export enum EventName {
  // Client
  CLIENT_RUN = "clientrun",

  // Commands
  COMMAND_BUILD = "commandbuild",
  COMMAND_DEPLOY = "commanddeploy",

  // Connection
  CONNECTION_REFRESH = "connectionrefresh",
  CONNECTION_STATIC = "connectionstatic",

  // Editor
  EDITOR_FOCUS = "editorfocus",
  EDITOR_FORMAT = "editorformat",

  // Explorer
  EXPLORER_STATIC = "explorerstatic",
  EXPLORER_ON_DID_SWITCH_FILE = "explorerondidswitchfile",
  EXPLORER_ON_DID_CHANGE_WORKSPACE = "explorerondidchangeworkspace",
  EXPLORER_ON_DID_DELETE_WORKSPACE = "explorerondiddeleteworkspace",

  // Modal
  MODAL_SET = "modalset",

  // Playnet
  PLAYNET_FETCH_SET = "playnetfetchset",

  // Program info
  PROGRAM_INFO_ON_DID_CHANGE = "programinfoondidchange",
  PROGRAM_INFO_ON_DID_CHANGE_UUID = "programinfoondidchangeuuid",
  PROGRAM_INFO_ON_DID_CHANGE_KP = "programinfoondidchangekp",
  PROGRAM_INFO_ON_DID_CHANGE_PK = "programinfoondidchangepk",
  PROGRAM_INFO_ON_DID_CHANGE_CUSTOM_PK = "programinfoondidchangecustompk",
  PROGRAM_INFO_ON_DID_CHANGE_IDL = "programinfoondidchangeidl",

  // Router
  ROUTER_NAVIGATE = "routernavigate",
  ROUTER_LOCATION = "routerlocation",

  // Terminal
  TERMINAL_DISABLE = "terminaldisable",
  TERMINAL_ENABLE = "terminalenable",
  TERMINAL_RUN_LAST_CMD = "terminalrunlastcmd",
  TERMINAL_SCROLL_TO_BOTTOM = "terminalscrolltobottom",
  TERMINAL_STATE = "terminalstate",
  TERMINAL_STATIC = "terminalstatic",
  TERMINAL_WAIT_FOR_INPUT = "terminalwaitforinput",
  TERMINAL_PROGRESS_SET = "terminalprogressset",

  // Theme
  THEME_SET = "themeset",
  THEME_FONT_SET = "fontset",

  // Tutorial
  TUTORIAL_STATIC = "tutorialstatic",
  TUTORIAL_PAGE_STATIC = "tutorialpagestatic",

  // View
  VIEW_MAIN_STATIC = "viewmainstatic",
  VIEW_SIDEBAR_STATE_SET = "viewsidebarstateset",
  VIEW_ON_DID_CHANGE_SIDEBAR_STATE = "viewondidchangesidebarstate",

  // Wallet
  WALLET_UI_BALANCE_SET = "walletuibalanceset",
  WALLET_ON_DID_CHANGE_CURRENT_WALLET = "walletondidchangecurrentwallet",
  WALLET_ON_DID_UPDATE = "walletondidupdate",
  WALLET_ON_DID_UPDATE_CONNECTION = "walletondidupdateconnection",
  WALLET_ON_DID_UPDATE_KEYPAIR = "walletondidupdatekeypair",
}
