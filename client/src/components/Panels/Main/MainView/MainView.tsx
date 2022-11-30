import { useEffect, useState } from "react";

import EditorWithTabs from "./EditorWithTabs";
import { MainViewLoading } from "../../../Loading";
import { EventName } from "../../../../constants";
import { PgCommon } from "../../../../utils/pg";

const MainView = () => {
  const [El, setEl] = useState(EditorWithTabs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSetMainView = async (
      e: UIEvent & { detail: { El: () => JSX.Element } }
    ) => {
      setLoading(true);
      await PgCommon.transition(
        (async () => {
          setEl(e.detail.El ?? EditorWithTabs);
        })(),
        300
      );
      setLoading(false);
    };

    document.addEventListener(
      EventName.VIEW_MAIN_SET,
      handleSetMainView as any
    );
    return () =>
      document.removeEventListener(
        EventName.VIEW_MAIN_SET,
        handleSetMainView as any
      );
  }, []);

  if (loading) return <MainViewLoading tutorialsBg />;

  return El;
};

export default MainView;
