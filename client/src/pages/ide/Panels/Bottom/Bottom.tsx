import styled, { css } from "styled-components";

import Delayed from "../../../../components/Delayed";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import Tooltip from "../../../../components/Tooltip";
import { Id } from "../../../../constants";
import { BOTTOM } from "../../../../views";
import { PgTheme } from "../../../../utils/pg";

const Bottom = () => (
  <Wrapper id={Id.BOTTOM}>
    {/* Add delay to give enough time for component dependencies to initialize */}
    <Delayed delay={60}>
      {BOTTOM.map((Component, i) => (
        <ErrorBoundary
          key={i}
          refreshButton={{ margin: "0 0.25rem 0 0.5rem" }}
          Fallback={({ error }) => (
            <Tooltip
              element={error.message || "Unknown error"}
              alwaysTakeFullWidth
            >
              <FallbackText>
                Extension crashed{error.message ? `: ${error.message}` : ""}
              </FallbackText>
            </Tooltip>
          )}
        >
          <Component />
        </ErrorBoundary>
      ))}
    </Delayed>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    & > div {
      height: 100%;
      display: flex;
      align-items: center;
    }

    ${PgTheme.convertToCSS(theme.components.bottom.default)};
  `}
`;

const FallbackText = styled.span`
  ${({ theme }) => css`
    display: inline-block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 15rem;
    color: ${theme.colors.state.error.color};
  `}
`;

export default Bottom;
