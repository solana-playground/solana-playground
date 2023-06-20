import { PgCommon } from "../common";
import type { FullFile } from "./types";

export class PgExplorerEvent {
  /** `onDidCreateItem` event name */
  static readonly ON_DID_CREATE_ITEM = "explorerondidcreateitem";
  /** `onDidRenameItem` event name */
  static readonly ON_DID_RENAME_ITEM = "explorerondidrenameitem";
  /** `onDidDeleteItem` event name */
  static readonly ON_DID_DELETE_ITEM = "explorerondiddeleteitem";
  /** `onDidSwitchFile` event name */
  static readonly ON_DID_SWITCH_FILE = "explorerondidswitchfile";
  /** `onDidCloseTab` event name */
  static readonly ON_DID_CLOSE_TAB = "explorerondidclosetab";

  /** `onDidCreateWorkspace` event name */
  static readonly ON_DID_CREATE_WORKSPACE = "explorerondidcreateworkspace";
  /** `onDidRenameWorkspace` event name */
  static readonly ON_DID_RENAME_WORKSPACE = "explorerondidrenameworkspace";
  /** `onDidDeleteWorkspace` event name */
  static readonly ON_DID_DELETE_WORKSPACE = "explorerondiddeleteworkspace";
  /** `onDidSwitchWorkspace` event name */
  static readonly ON_DID_SWITCH_WORKSPACE = "explorerondidswitchworkspace";

  /** Dispatch an `onDidCreateItem` event. */
  static dispatchOnDidCreateItem() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_CREATE_ITEM);
  }

  /** Dispatch an `onDidRenameItem` event. */
  static dispatchOnDidRenameItem() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_RENAME_ITEM);
  }

  /** Dispatch an `onDidDeleteItem` event. */
  static dispatchOnDidDeleteItem() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_DELETE_ITEM);
  }

  /** Dispatch an `onDidSwitchFile` event. */
  static dispatchOnDidSwitchFile(file: FullFile | null) {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_SWITCH_FILE, file);
  }

  /** Dispatch an `onDidCloseTab` event. */
  static dispatchOnDidCloseTab() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_CLOSE_TAB);
  }

  /** Dispatch an `onDidCreateWorkspace` event. */
  static dispatchOnDidCreateWorkspace() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_CREATE_WORKSPACE);
  }

  /** Dispatch an `onDidRenameWorkspace` event. */
  static dispatchOnDidRenameWorkspace() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_RENAME_WORKSPACE);
  }

  /** Dispatch an `onDidDeleteWorkspace` event. */
  static dispatchOnDidDeleteWorkspace() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_DELETE_WORKSPACE);
  }

  /** Dispatch an `onDidSwitchWorkspace` event. */
  static dispatchOnDidSwitchWorkspace() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_SWITCH_WORKSPACE);
  }
}
