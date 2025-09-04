import { useEffect } from "react";
import { EFFECTS } from "../../effects";

const Effects = () => {
  useEffect(() => {
    const disposables = EFFECTS.map((effect) => effect());
    return () => disposables.forEach(({ dispose }) => dispose());
  }, []);

  return null;
};

export default Effects;
