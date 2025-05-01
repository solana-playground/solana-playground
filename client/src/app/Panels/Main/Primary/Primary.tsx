import { useCallback, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import ErrorBoundary from "../../../../components/ErrorBoundary";
import PrimaryError from "./PrimaryError";
import { SpinnerWithBg } from "../../../../components/Loading";
import {
  CallableJSX,
  NullableJSX,
  PgCommon,
  PgTheme,
  PgView,
} from "../../../../utils/pg";
import { useGetAndSetStatic } from "../../../../hooks";

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
          const initialEl = el;
          return (
            <PrimaryError
              error={e}
              retry={() => setElWithTransition(initialEl)}
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
