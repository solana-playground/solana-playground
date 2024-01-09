import { FC, createContext, useContext } from "react";

import type { Idl } from "../../../../utils/pg/program-interaction";

interface IdlProviderProps {
  idl: Idl;
}

const IdlContext = createContext<IdlProviderProps | null>(null);

const IdlProvider: FC<IdlProviderProps> = ({ children, ...props }) => {
  return <IdlContext.Provider value={props}>{children}</IdlContext.Provider>;
};

export const useIdl = () => {
  const ix = useContext(IdlContext);
  if (!ix) throw new Error("IDL provider not provided");

  return ix;
};

export default IdlProvider;
