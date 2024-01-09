import { RefObject, useEffect } from "react";

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
      if (ev.target && !ref.current?.contains(ev.target as Node)) {
        cb();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [ref, cb, listenCondition]);
};
