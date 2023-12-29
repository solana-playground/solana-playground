import styled from "styled-components";

import Checkbox from "../../../../../components/Checkbox";
import { HelpTooltip } from "../../../../../components/Tooltip";
import { PgCommon, PgSettings } from "../../../../../utils/pg";

type BuildFlag = keyof typeof PgSettings["build"]["flags"];

const BUILD_FLAGS: { [K in BuildFlag]: string } = {
  noDocs: "Disable documentation in IDL",
  safetyChecks: "Require `/// CHECK:` comments for unchecked accounts",
  seedsFeature: "Include seeds in IDL",
};

const BuildFlags = () => (
  <Wrapper>
    {PgCommon.entries(BUILD_FLAGS).map(([flag, details]) => (
      <Row key={flag}>
        <Checkbox
          label={PgCommon.toTitleFromCamel(flag)}
          onChange={(ev) => {
            PgSettings.build.flags[flag] = ev.target.checked;
          }}
          defaultChecked={PgSettings.build.flags[flag]}
        />
        <HelpTooltip element={details} placement="right" maxWidth="15rem" />
      </Row>
    ))}
  </Wrapper>
);

const Wrapper = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Row = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export default BuildFlags;
