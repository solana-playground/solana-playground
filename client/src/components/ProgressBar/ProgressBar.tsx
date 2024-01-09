import { FC, useEffect, useRef } from "react";
import styled, { css, useTheme } from "styled-components";

import { PgTheme } from "../../utils/pg";

interface ProgressBarProps {
  value: number;
}

const ProgressBar: FC<ProgressBarProps> = ({ value }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Hide progress bar when value is falsy value but still allow the animation
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.borderColor = value
        ? theme.colors.default.border
        : "transparent";
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, theme.name]);

  return (
    <Wrapper ref={wrapperRef}>
      <Indicator style={{ width: `${value.toString()}%` }} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.progressbar.default)};
  `}
`;

const Indicator = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.progressbar.indicator)};
  `}
`;

export default ProgressBar;
