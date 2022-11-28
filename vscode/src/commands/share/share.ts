import * as vscode from "vscode";
import fetch from "node-fetch";

import { CLIENT_URL, PATHS, SERVER_URL } from "../../constants";
import { pgChannel, PgCommon, PgFs } from "../../utils";

interface ShareJSON {
  files: {
    [key: string]: {
      content?: string;
      current?: boolean;
      tabs?: boolean;
    };
  };
}

export const processShare = async () => {
  const shareJSON: ShareJSON = { files: {} };
  const { files, name } = await PgFs.getProgramData();

  let openedFile;
  for (const file of files) {
    const path = file[0];
    // Only open a file if no file has been opened
    const openCondition =
      !openedFile ||
      path.endsWith(PATHS.FILES.LIB_RS) ||
      path.endsWith(".py") ||
      undefined;
    if (openCondition) {
      openedFile = true;
    }
    shareJSON.files[path] = {
      content: file[1],
      current: openCondition,
      tabs: openCondition,
    };
  }

  const resp = await fetch(`${SERVER_URL}/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      explorer: shareJSON,
    }),
  });

  const result = await PgCommon.checkForRespErr(resp.clone());
  const objectId = PgCommon.decodeBytes(result);
  const shareUrl = `${CLIENT_URL}/${objectId}`;

  pgChannel.appendLine(`Shared project ${name}. Link: ${shareUrl}`);

  // Open the shared link in the browser
  vscode.env.openExternal(vscode.Uri.parse(shareUrl));
};
