import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled, { css } from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { PgCommon, PgTheme } from "../../../../utils/pg";
import { EventName } from "../../../../constants";
import { useSetStatic } from "../../../../hooks";
import { SIDEBAR } from "../../../../views";

const Side = () => {
  const { pathname } = useLocation();

  const [sidebarPage, setSidebarPage] = useState<SidebarPageName>(
    pathname.startsWith("/tutorials") ? "Tutorials" : "Explorer"
  );
  const [width, setWidth] = useState(320);
  const [oldWidth, setOldWidth] = useState(width);

  useEffect(() => {
    if (width) setOldWidth(width);
  }, [width]);

  const oldSidebarRef = useRef(sidebarPage);

  useSetStatic(setSidebarPage, EventName.VIEW_SIDEBAR_STATE_SET);

  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_ON_DID_CHANGE_SIDEBAR_PAGE,
      sidebarPage
    );
  }, [sidebarPage]);

  // Handle keybinds
  useEffect(() => {
    const isKeybindValid = (keybind: string, ev: KeyboardEvent) => {
      let isValid = true;

      const keys = keybind.toUpperCase().replaceAll(" ", "").split("+");
      for (const key of keys) {
        switch (key) {
          case "CTRL":
          case "CONTROL":
            isValid &&= ev.ctrlKey || ev.metaKey;
            break;

          case "ALT":
            isValid &&= ev.altKey;
            break;

          case "SHIFT":
            isValid &&= ev.shiftKey;
            break;

          default:
            isValid &&= key === ev.key.toUpperCase();
        }
      }

      return isValid;
    };

    const handleKey = (ev: KeyboardEvent) => {
      setSidebarPage((page) => {
        const keybindPage = SIDEBAR.find(
          (p) => p.keybind && isKeybindValid(p.keybind, ev)
        );
        if (!keybindPage) return page;

        // Prevent default keybind
        ev.preventDefault();

        const closeCondition = width !== 0 && page === keybindPage.name;
        setWidth(closeCondition ? 0 : oldWidth);
        return keybindPage.name;
      });
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [width, oldWidth]);

  return (
    <Wrapper>
      <Left
        sidebarPage={sidebarPage}
        setSidebarPage={setSidebarPage}
        oldSidebarRef={oldSidebarRef}
        width={width}
        setWidth={setWidth}
        oldWidth={oldWidth}
      />
      <Right sidebarPage={sidebarPage} width={width} setWidth={setWidth} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) =>
    css`
      display: flex;

      ${PgTheme.convertToCSS(theme.components.sidebar.default)};
    `}
`;

export default Side;
