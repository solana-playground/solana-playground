import { useEffect, useRef } from "react";
import { useTheme } from "styled-components";

import { PgCommon } from "../utils/pg";

/**
 * Use a different background than the parent node's background.
 *
 * @returns the element ref object to attach
 */
export const useDifferentBackground = <
  T extends HTMLElement = HTMLDivElement
>() => {
  const ref = useRef<T>(null);

  const theme = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    let parent: HTMLElement | null | undefined = ref.current;
    let inheritedBg = "";
    while (1) {
      parent = parent?.parentElement;
      if (!parent) continue;

      const style = getComputedStyle(parent);
      if (style.backgroundImage !== "none") {
        inheritedBg = style.backgroundImage;
        break;
      }

      if (style.backgroundColor !== "rgba(0, 0, 0, 0)") {
        inheritedBg = style.backgroundColor;
        break;
      }
    }

    const textBg = theme.components.text.default.bg!;
    if (PgCommon.isColorsEqual(inheritedBg, textBg)) {
      const { bgPrimary, bgSecondary } = theme.colors.default;
      if (PgCommon.isColorsEqual(inheritedBg, bgPrimary)) {
        ref.current.style.background = bgSecondary;
      } else {
        ref.current.style.background = bgPrimary;
      }
    } else {
      ref.current.style.background = textBg;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.name]);

  return { ref };
};
