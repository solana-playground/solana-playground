import {
  ComponentPropsWithoutRef,
  forwardRef,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import LangIcon from "../LangIcon";
import Menu from "../Menu";
import { Close } from "../Icons";
import { PgExplorer, PgTheme } from "../../utils/pg";
import type { SortableItemProvidedProps } from "../Dnd/Sortable";

interface TabProps extends ComponentPropsWithoutRef<"div"> {
  path: string;
  index: number;
}

const Tab = forwardRef<HTMLDivElement, TabProps>(
  ({ path, index, ...props }, ref) => {
    const [isSelected, setIsSelected] = useState(false);

    const fileName = useMemo(
      () => PgExplorer.getItemNameFromPath(path),
      [path]
    );

    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const changeTab = useCallback(
      (ev: MouseEvent<HTMLDivElement>) => {
        if (!closeButtonRef.current?.contains(ev.target as Node)) {
          PgExplorer.openFile(path);
        }
      },
      [path]
    );

    const closeFile = useCallback(() => PgExplorer.closeFile(path), [path]);

    const closeOthers = useCallback(() => {
      PgExplorer.tabs
        .filter((tabPath) => tabPath !== path)
        .forEach((tabPath) => PgExplorer.closeFile(tabPath));
    }, [path]);

    const closeToTheRight = useCallback(() => {
      const tabIndex = PgExplorer.tabs.findIndex((tabPath) => tabPath === path);
      PgExplorer.tabs
        .slice(tabIndex + 1)
        .forEach((tabPath) => PgExplorer.closeFile(tabPath));
    }, [path]);

    const closeAll = useCallback(() => {
      // Clone the tabs before closing because `PgExplorer.closeFile` mutates
      // the existing tabs array
      [...PgExplorer.tabs].forEach((tabPath) => PgExplorer.closeFile(tabPath));
    }, []);

    return (
      <Menu.Context
        items={[
          {
            name: "Close",
            onClick: closeFile,
            keybind: "ALT+W",
          },
          {
            name: "Close Others",
            onClick: closeOthers,
            showCondition: PgExplorer.tabs.length > 1,
          },
          {
            name: "Close To The Right",
            onClick: closeToTheRight,
            showCondition: PgExplorer.tabs.length - 1 > index,
          },
          {
            name: "Close All",
            onClick: closeAll,
          },
        ]}
        onShow={() => setIsSelected(true)}
        onHide={() => setIsSelected(false)}
      >
        <Wrapper
          isSelected={isSelected}
          isCurrent={path === PgExplorer.currentFilePath}
          onClick={changeTab}
          title={path}
          ref={ref}
          {...(props as SortableItemProvidedProps)}
        >
          <LangIcon fileName={fileName} />
          <Name>{fileName}</Name>
          <Button
            ref={closeButtonRef}
            kind="icon"
            onClick={closeFile}
            title="Close (Alt+W)"
          >
            <Close />
          </Button>
        </Wrapper>
      </Menu.Context>
    );
  }
);

const Wrapper = styled.div<{
  isSelected: boolean;
  isCurrent: boolean;
  isDragging: boolean;
  isDragOverlay: boolean;
}>`
  ${({ theme, isSelected, isCurrent, isDragging, isDragOverlay }) => css`
    & button {
      ${!isCurrent && "opacity: 0;"}
      margin: 0 0.25rem 0 0.5rem;

      & svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    &:hover button {
      opacity: 1;
    }

    ${PgTheme.convertToCSS(theme.components.tabs.tab.default)};
    ${isSelected && PgTheme.convertToCSS(theme.components.tabs.tab.selected)};
    ${isCurrent && PgTheme.convertToCSS(theme.components.tabs.tab.current)};
    ${isDragging && PgTheme.convertToCSS(theme.components.tabs.tab.drag)};
    ${isDragOverlay &&
    PgTheme.convertToCSS(theme.components.tabs.tab.dragOverlay)};
  `}
`;

const Name = styled.span`
  margin-left: 0.375rem;
  white-space: nowrap;
`;

export default Tab;
