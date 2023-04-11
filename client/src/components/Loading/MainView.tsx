import { FC } from "react";
import styled from "styled-components";

import { Wormhole } from "./Wormhole";

interface MainViewLoadingProps {
  tutorialsBg?: boolean;
}

export const MainViewLoading: FC<MainViewLoadingProps> = (props) => (
  <LoadingWrapper {...props}>
    <Wormhole size={10} />
  </LoadingWrapper>
);

const LoadingWrapper = styled.div<MainViewLoadingProps>`
  background: ${({ tutorialsBg, theme }) =>
    tutorialsBg && theme.components.tutorials.default.bg};
  flex: 1;
  height: 100%;
  display: flex;
`;
