import { PgCommon } from "../common";
import type { FullFile } from "./types";

export class PgExplorerEvent {
  /** `onDidCreateItem` event name */
  static readonly ON_DID_INIT = "explorerondidinit";

  /** `onDidCreateItem` event name */
  static readonly ON_DID_CREATE_ITEM = "explorerondidcreateitem";
  /** `onDidRenameItem` event name */
  static readonly ON_DID_RENAME_ITEM = "explorerondidrenameitem";
  /** `onDidDeleteItem` event name */
  static readonly ON_DID_DELETE_ITEM = "explorerondiddeleteitem";
  /** `onDidOpenFile` event name */
  static readonly ON_DID_OPEN_FILE = "explorerondidopenfile";
  /** `onDidCloseFile` event name */
  static readonly ON_DID_CLOSE_FILE = "explorerondidclosefile";
  /** `onDidSetTabs` event name */
  static readonly ON_DID_SET_TABS = "explorerondidsettabs";

  /** `onDidCreateWorkspace` event name */
  static readonly ON_DID_CREATE_WORKSPACE = "explorerondidcreateworkspace";
  /** `onDidRenameWorkspace` event name */
  static readonly ON_DID_RENAME_WORKSPACE = "explorerondidrenameworkspace";
  /** `onDidDeleteWorkspace` event name */
  static readonly ON_DID_DELETE_WORKSPACE = "explorerondiddeleteworkspace";
  /** `onDidSwitchWorkspace` event name */
  static readonly ON_DID_SWITCH_WORKSPACE = "explorerondidswitchworkspace";

  /** Dispatch an `onDidInit` event. */
  static dispatchOnDidInit() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_INIT);
  }

  /** Dispatch an `onDidCreateItem` event. */
  static dispatchOnDidCreateItem() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_CREATE_ITEM);
  }

  /** Dispatch an `onDidRenameItem` event. */
  static dispatchOnDidRenameItem(path: string) {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_RENAME_ITEM, path);
  }

  /** Dispatch an `onDidDeleteItem` event. */
  static dispatchOnDidDeleteItem(path: string) {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_DELETE_ITEM, path);
  }

  /** Dispatch an `onDidOpenFile` event. */
  static dispatchOnDidOpenFile(file: FullFile | null) {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_OPEN_FILE, file);
  }

  /** Dispatch an `onDidCloseFile` event. */
  static dispatchOnDidCloseFile() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_CLOSE_FILE);
  }

  /** Dispatch an `onDidSetTabs` event. */
  static dispatchOnDidSetTabs() {
    PgCommon.createAndDispatchCustomEvent(this.ON_DID_SET_TABS);
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
