import { FC, useEffect, useState } from "react";

interface DelayedProps {
  /** The amount of miliseconds to sleep before rendering the `children` */
  delay?: number;
}

const Delayed: FC<DelayedProps> = ({ delay, children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (!ready) return null;

  return <>{children}</>;
};

export default Delayed;
