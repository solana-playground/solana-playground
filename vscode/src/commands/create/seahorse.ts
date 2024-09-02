import * as path from "path";

import { PATHS } from "../../constants";
import { Files, PgFs } from "../../utils";
import { processCreateAnchor } from "./anchor";

export const processCreateSeahorse = async () => {
  // Create Anchor
  const { name, projectUri } = await processCreateAnchor();

  const seahorseFiles: Files = [
    // Program <name>.py
    [
      path.join(PATHS.DIRS.PROGRAMS_PY, `${name}.py`),
      `# ${name}
# Built with Seahorse v0.2.0

from seahorse.prelude import *

declare_id('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS')
`,
    ],

    // __init__.py
    [
      path.join(
        PATHS.DIRS.PROGRAMS_PY,
        PATHS.DIRS.SEAHORSE,
        PATHS.FILES.INIT_PY
      ),
      "",
    ],

    // prelude.py
    [
      path.join(
        PATHS.DIRS.PROGRAMS_PY,
        PATHS.DIRS.SEAHORSE,
        PATHS.FILES.PRELUDE_PY
      ),
      require("./seahorse-prelude.py"),
    ],
  ];

  await PgFs.writeFiles(seahorseFiles, projectUri);
};
