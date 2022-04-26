import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import { explorerAtom, refreshExplorerAtom } from "../../../../state";
import Tab from "./Tab";

// Same height with Side-Right Title
export const TAB_HEIGHT = "2rem";

const Tabs = () => {
  const [explorer] = useAtom(explorerAtom);
  useAtom(refreshExplorerAtom);

  // No need memoization
  const tabs = explorer.getTabs();

  return (
    <Wrapper>
      {tabs.map((t, i) => (
        <Tab key={i} current={t.current!} path={t.path} />
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    height: ${TAB_HEIGHT};
    user-select: none;
    background-color: ${theme.colors.right?.bg};
    border-bottom: 1px solid ${theme.colors.default.borderColor};
    font-size: ${theme.font?.size.small};
  `}
`;

export default Tabs;
