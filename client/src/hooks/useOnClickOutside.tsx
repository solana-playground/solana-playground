import { RefObject, useEffect } from "react";

import { PgCommon, PgView } from "../utils";

/**
 * Run the given callback when the user clicks outside of the given element.
 *
 * @param ref element reference
 * @param cb callback function to run on outside click
 * @param listenCondition only listen for click events if this condition is truthy
 */
export const useOnClickOutside = (
  ref: RefObject<HTMLElement>,
  cb: () => void,
  listenCondition: boolean = true
) => {
  useEffect(() => {
    if (!listenCondition) return;

    const handleOutsideClick = (ev: MouseEvent) => {
      const el = ref.current;
      const targetEl = ev.target;
      if (!el || !targetEl) return;
      if (!(targetEl instanceof HTMLElement)) return;
      if (el.contains(targetEl)) return;

      // Account for portals (they're not actually inside current ref)
      const isPortalChild = [PgView.ids.PORTAL_ABOVE, PgView.ids.PORTAL_BELOW]
        .map((id) => document.getElementById(id))
        .filter(PgCommon.isNonNullish)
        .some((el) => el.contains(targetEl));

      // TODO: Make this more robust (portal children don't have to be inside)
      if (isPortalChild) return;

      cb();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [ref, cb, listenCondition]);
};
