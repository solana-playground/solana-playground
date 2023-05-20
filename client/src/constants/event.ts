export enum EventName {
  // Deploy
  BUILD_ON_DID_BUILD = "buildondidbuild",

  // Commands
  COMMAND_BUILD = "commandbuild",
  COMMAND_DEPLOY = "commanddeploy",

  // Connection
  CONNECTION_REFRESH = "connectionrefresh",
  CONNECTION_STATIC = "connectionstatic",

  // Deploy
  DEPLOY_ON_DID_DEPLOY = "deployondiddeploy",

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
  PROGRAM_INFO_ON_DID_CHANGE_PK = "programinfoondidchangepk",

  // Router
  ROUTER_NAVIGATE = "routernavigate",
  ROUTER_LOCATION = "routerlocation",

  // Terminal
  TERMINAL_STATE = "terminalstate",
  TERMINAL_STATIC = "terminalstatic",
  TERMINAL_WAIT_FOR_INPUT = "terminalwaitforinput",
  TERMINAL_PROGRESS_SET = "terminalprogressset",

  // Theme
  THEME_SET = "themeset",
  THEME_FONT_SET = "fontset",

  // Toast
  TOAST_SET = "toastset",

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
