import CheckBox from "../../components/CheckBox";
import { PgSettings } from "../../utils/pg";

const ShowTxDetailsSetting = () => (
  <CheckBox
    onChange={(ev) => {
      PgSettings.testUi.showTxDetailsInTerminal = ev.target.checked;
    }}
    checkedOnMount={PgSettings.testUi.showTxDetailsInTerminal}
  />
);

export default ShowTxDetailsSetting;
