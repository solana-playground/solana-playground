import CheckBox from "../../components/CheckBox";
import { PgSettings } from "../../utils/pg";

const PreflightSetting = () => (
  <CheckBox
    onChange={(ev) => {
      PgSettings.connection.preflightChecks = ev.target.checked;
    }}
    checkedOnMount={PgSettings.connection.preflightChecks}
  />
);

export default PreflightSetting;
