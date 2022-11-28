import * as path from "path";

import { PATHS } from "../../constants";
import { processCreateAnchor } from "./anchor";
import { processCreate } from "./common";

export const processCreateSeahorse = async () => {
  // Create Anchor
  const { name } = await processCreateAnchor();

  // Create Seahorse
  await processCreate({
    name,
    files: [
      // Program <name>.py
      [
        path.join(PATHS.DIRS.PROGRAMS_PY, `${name}.py`),
        `# ${name}
# Built with Seahorse v0.2.3

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
    ],
  });
};
