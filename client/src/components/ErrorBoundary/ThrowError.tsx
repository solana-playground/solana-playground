import { FC } from "react";

import { SpinnerWithBg } from "../Loading";
import { useAsyncEffect } from "../../hooks";
import type { Fn } from "../../utils";

interface ThrowErrorProps {
  /** Refresh the element */
  refresh: () => Promise<Fn | void>;
}

const ThrowError: FC<ThrowErrorProps> = ({ refresh }) => {
  useAsyncEffect(refresh, [refresh]);
  return <SpinnerWithBg loading size="2rem" />;
};

export default ThrowError;
