import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const PreflightSetting = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.connection.preflightChecks = ev.target.checked;
    }}
    defaultChecked={PgSettings.connection.preflightChecks}
  />
);

export default PreflightSetting;
