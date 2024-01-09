import type {
  CandyGuardsSettings,
  DefaultCandyGuardSettings,
  Option,
} from "@metaplex-foundation/js";

export interface CandyGuardData {
  default: DefaultCandyGuardSettings;
  groups: Option<Group[]>;
}

interface Group {
  label: string;
  guards: CandyGuardsSettings;
}
