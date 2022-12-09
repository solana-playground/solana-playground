import { useCallback, useState } from "react";

import EditorWithTabs from "./EditorWithTabs";
import { MainViewLoading } from "../../../Loading";
import { EventName } from "../../../../constants";
import { PgCommon } from "../../../../utils/pg";
import { useGetAndSetStatic } from "../../../../hooks";

const MainView = () => {
  const [El, setEl] = useState(EditorWithTabs);
  const [loading, setLoading] = useState(true);

  const setElWithTransition = useCallback(
    async (El: JSX.Element | ((El: JSX.Element) => JSX.Element)) => {
      setLoading(true);
      await PgCommon.transition(
        (async () => {
          setEl(El ?? EditorWithTabs);
        })(),
        300
      );
      setLoading(false);
    },
    []
  );

  useGetAndSetStatic(El, setElWithTransition, EventName.VIEW_MAIN_STATIC);

  if (loading) return <MainViewLoading tutorialsBg />;

  return El;
};

export default MainView;
