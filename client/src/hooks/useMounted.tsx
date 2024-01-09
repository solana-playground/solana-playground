import { useEffect, useRef } from "react";

/**
 * Get whether the component is mounted.
 *
 * @returns whether the component is mounted
 */
export const useMounted = () => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  });

  return mounted;
};
