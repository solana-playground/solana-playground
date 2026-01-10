import { FC, useState } from "react";

import { SpinnerWithBg } from "../Loading";
import { useAsyncEffect } from "../../hooks";
import { PgCommon } from "../../utils";

interface ThrowErrorProps {
  /** Refresh the element */
  refresh: () => Promise<unknown>;
}

const ThrowError: FC<ThrowErrorProps> = ({ refresh }) => {
  const [, setError] = useState();
  useAsyncEffect(async () => {
    try {
      await PgCommon.transition(refresh);
    } catch (e) {
      // Error boundaries do not catch promise errors.
      // See https://github.com/facebook/react/issues/11334
      //
      // As a workaround, the following line manually triggers a render error,
      // which is then caught by the parent `ErrorBoundary` component.
      setError(() => {
        throw e;
      });
    }
  }, [refresh]);

  return <SpinnerWithBg loading size="2rem" />;
};

export default ThrowError;
