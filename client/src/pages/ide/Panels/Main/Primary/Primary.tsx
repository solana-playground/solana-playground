import { useCallback, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import ErrorBoundary from "../../../../../components/ErrorBoundary";
import { SpinnerWithBg } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import {
  CallableJSX,
  NullableJSX,
  PgCommon,
  PgRouter,
  PgTheme,
  SetElementAsync,
} from "../../../../../utils/pg";
import { useGetAndSetStatic } from "../../../../../hooks";

const Primary = () => {
  const [el, setEl] = useState<CallableJSX | NullableJSX>(null);
  const [loading, setLoading] = useState(true);

  const setElWithTransition = useCallback(async (SetEl: SetElementAsync) => {
    setLoading(true);
    setEl(null);

    const TransitionedEl = await PgCommon.transition(async () => {
      try {
        const ElPromise = typeof SetEl === "function" ? SetEl(null) : SetEl;
        return await ElPromise;
      } catch (e: any) {
        console.log("MAIN VIEW ERROR:", e.message);
        PgRouter.navigate();
      }
    });
    if (TransitionedEl) {
      setEl(
        typeof TransitionedEl === "function" ? (
          <TransitionedEl />
        ) : (
          TransitionedEl
        )
      );
    }

    setLoading(false);
  }, []);

  useGetAndSetStatic(
    el,
    setElWithTransition,
    EventName.VIEW_MAIN_PRIMARY_STATIC
  );

  return (
    <Wrapper>
      <StyledSpinnerWithBg loading={loading} size="2rem">
        <ErrorBoundary>{el}</ErrorBoundary>
      </StyledSpinnerWithBg>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.main.primary.default)};
  `}
`;

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

export default Primary;
