import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const ShowTxDetailsSetting = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.testUi.showTxDetailsInTerminal = ev.target.checked;
    }}
    defaultChecked={PgSettings.testUi.showTxDetailsInTerminal}
  />
);

export default ShowTxDetailsSetting;
