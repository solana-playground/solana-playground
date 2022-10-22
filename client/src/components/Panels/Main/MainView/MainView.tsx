import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import EditorWithTabs from "./EditorWithTabs";
import MainViewLoading from "./MainViewLoading";
import Tutorials from "./Tutorials";
import { EventName, Route } from "../../../../constants";
import {
  PgCommon,
  PgExplorer,
  PgRouter,
  PgTutorial,
} from "../../../../utils/pg";

const MainView = () => {
  const [El, setEl] = useState(EditorWithTabs);
  const [loading, setLoading] = useState(true);

  const { pathname } = useLocation();

  useEffect(() => {
    setLoading(true);
    (async () => {
      await PgCommon.transition(
        (async () => {
          if (pathname.startsWith(Route.TUTORIALS)) {
            if (pathname === Route.TUTORIALS) {
              setEl(Tutorials);
            } else {
              const tutorial = PgTutorial.getTutorialFromPathname(pathname);
              if (!tutorial) {
                PgRouter.navigate(Route.TUTORIALS);
                return;
              }
              PgTutorial.setCurrent(tutorial);

              const { default: El } = await tutorial.elementImport();
              setEl(() => <El {...tutorial} />);
            }
          } else if (await PgTutorial.isCurrentWorkspaceTutorial()) {
            const tutorialName = (await PgExplorer.get()).currentWorkspaceName;
            PgTutorial.openTutorial(tutorialName!);
          } else {
            setEl(EditorWithTabs);
          }
        })(),
        400
      );

      setLoading(false);
    })();
  }, [pathname]);

  useEffect(() => {
    const handleSetMainView = (
      e: UIEvent & { detail: { El: () => JSX.Element } }
    ) => {
      setEl(e.detail.El ?? EditorWithTabs);
    };

    document.addEventListener(
      EventName.VIEW_MAIN_SET,
      handleSetMainView as EventListener
    );
    return () =>
      document.removeEventListener(
        EventName.VIEW_MAIN_SET,
        handleSetMainView as EventListener
      );
  }, []);

  if (loading) return <MainViewLoading tutorialsBg />;

  return El;
};

export default MainView;
