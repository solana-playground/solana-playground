import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const ShowTxDetailsSetting = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.build.improveErrors = ev.target.checked;
    }}
    defaultChecked={PgSettings.build.improveErrors}
  />
);

export default ShowTxDetailsSetting;
