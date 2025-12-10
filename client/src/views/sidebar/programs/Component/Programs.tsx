import { FC } from "react";

import FilterGroups from "../../../../components/FilterGroups";
import type { Filter } from "../../../../hooks";

interface ProgramsProps {
  // TODO: Proper type
  programs: any[];
  filters: Filter[];
}

const Programs: FC<ProgramsProps> = ({ programs, filters }) => (
  <FilterGroups items={programs} filters={filters} />
);

export default Programs;
