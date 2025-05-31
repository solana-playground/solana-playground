import { useCallback, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import ErrorBoundary from "../../../../components/ErrorBoundary";
import { SpinnerWithBg } from "../../../../components/Loading";
import {
  CallableJSX,
  NullableJSX,
  PgCommon,
  PgTheme,
  PgView,
} from "../../../../utils/pg";
import { useAsyncEffect, useGetAndSetStatic } from "../../../../hooks";

const Primary = () => {
  const [el, setEl] = useState<CallableJSX | NullableJSX>(null);

  const setElWithTransition = useCallback(async (el: any) => {
    if (PgCommon.isAsyncFunction(el)) {
      setEl(null);

      el = await PgCommon.transition(async () => {
        try {
          return await PgCommon.callIfNeeded(el);
        } catch (e: any) {
          console.log("MAIN VIEW ERROR:", e.message);
          const initialEl: () => Promise<CallableJSX | NullableJSX> = el;

          return (
            <PrimaryError
              retry={async () => {
                const el = await initialEl();
                setEl(PgCommon.callIfNeeded(el) ?? null);
              }}
            />
          );
        }
      });
    }

    setEl(PgCommon.callIfNeeded(el) ?? null);
  }, []);

  useGetAndSetStatic(
    el,
    setElWithTransition,
    PgView.events.MAIN_PRIMARY_STATIC
  );

  return (
    <Wrapper>
      <StyledSpinnerWithBg loading={!el} size="2rem">
        <ErrorBoundary>{el}</ErrorBoundary>
      </StyledSpinnerWithBg>
    </Wrapper>
  );
};

const PrimaryError = (props: { retry: () => Promise<unknown> }) => {
  const [, setError] = useState();
  useAsyncEffect(async () => {
    try {
      await props.retry();
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
  }, []);

  return <StyledSpinnerWithBg loading size="2rem" />;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.views.main.primary.default)};
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
