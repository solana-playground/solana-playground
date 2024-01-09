import { useEffect, useRef } from "react";
import { useTheme } from "styled-components";

import { PgTheme } from "../utils/pg";

/**
 * Use a different background than the parent node's background.
 *
 * @param delay the amount of miliseconds to delay the background check
 *
 * @returns the element ref object to attach
 */
export const useDifferentBackground = <T extends HTMLElement = HTMLDivElement>(
  delay?: number
) => {
  const ref = useRef<T>(null);

  const theme = useTheme();

  useEffect(() => {
    const id = setTimeout(() => {
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

      ref.current.style.background =
        PgTheme.getDifferentBackground(inheritedBg);
    }, delay);

    return () => clearTimeout(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, theme.name]);

  return { ref };
};
