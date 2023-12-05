import { FC } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../components/Foldable";

interface InteractionProps {
  name: string;
  index: number;
}

const Interaction: FC<InteractionProps> = ({ name, index, children }) => (
  <Wrapper index={index}>
    <Foldable element={<Name>{name}</Name>}>{children}</Foldable>
  </Wrapper>
);

const Wrapper = styled.div<Pick<InteractionProps, "index">>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.border};
    background: ${index % 2 === 0 &&
    theme.components.sidebar.right.default.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.border};
    }
  `}
`;

const Name = styled.span`
  font-weight: bold;
`;

export default Interaction;
