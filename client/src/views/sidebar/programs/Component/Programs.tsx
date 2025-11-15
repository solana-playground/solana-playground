import { FC } from "react";

import FilterGroups from "../../../../components/FilterGroups";
import { FILTERS } from "../../../main/primary/Programs/filters";

interface ProgramsProps {
  // TODO: Proper type
  programs: any[];
}

const Programs: FC<ProgramsProps> = ({ programs }) => (
  <FilterGroups filters={FILTERS} items={programs} />
);

export default Programs;
