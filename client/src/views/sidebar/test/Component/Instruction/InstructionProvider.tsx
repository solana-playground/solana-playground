import { Dispatch, FC, SetStateAction, createContext, useContext } from "react";

import type { GeneratableInstruction } from "../../../../../utils/pg/program-interaction";

interface InstructionProviderProps {
  instruction: GeneratableInstruction;
  setInstruction: Dispatch<SetStateAction<GeneratableInstruction>>;
}

const InstructionContext = createContext<InstructionProviderProps | null>(null);

const InstructionProvider: FC<InstructionProviderProps> = ({
  children,
  ...props
}) => {
  return (
    <InstructionContext.Provider value={props}>
      {children}
    </InstructionContext.Provider>
  );
};

export const useInstruction = () => {
  const ix = useContext(InstructionContext);
  if (!ix) throw new Error("Instruction provider not provided");

  return ix;
};

export default InstructionProvider;
