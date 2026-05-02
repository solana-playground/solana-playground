import { FC, useEffect } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";

import { PgCommon, PgRouter } from "../../utils";
import { useGetStatic } from "../../hooks";

export const RouterProvider: FC = ({ children }) => (
  <BrowserRouter>
    <InternalRouter>{children}</InternalRouter>
  </BrowserRouter>
);

const InternalRouter: FC = ({ children }) => {
  // Handle routes
  useEffect(() => PgRouter.init().dispose, []);

  // Location
  const location = useLocation();

  // Path
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      PgRouter.events.ON_DID_CHANGE_PATH,
      location.pathname
    );
  }, [location.pathname]);

  // Hash
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      PgRouter.events.ON_DID_CHANGE_HASH,
      location.hash
    );
  }, [location.hash]);

  // Navigate
  const navigate = useNavigate();
  useGetStatic(PgRouter.events.NAVIGATE, navigate);

  return <>{children}</>;
};
