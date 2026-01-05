import { FC, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import { SpinnerWithBg } from "../Loading";
import { useAsyncEffect } from "../../hooks";
import { PgCommon } from "../../utils/pg";

interface ThrowErrorProps {
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

  return <StyledSpinnerWithBg loading size="2rem" />;
};

const StyledSpinnerWithBg = styled(SpinnerWithBg)`
  ${({ theme }) => css`
    display: flex;

    & > *:last-child {
      flex: 1;
      overflow: auto;
      opacity: 0;
      animation: ${fadeInAnimation} ${theme.default.transition.duration.long}
        ${theme.default.transition.type} forwards;
    }
  `}
`;

const fadeInAnimation = keyframes`
  0% { opacity: 0 }
  40% { opacity : 0 }
  100% { opacity: 1 }
`;

export default ThrowError;
