import { ChangeEvent } from "react";

import CheckBox from "../../../../../../components/CheckBox";
import { PgPreferences } from "../../../../../../utils/pg";

const ShowTxDetailsSetting = () => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    PgPreferences.update({ showTxDetailsInTerminal: e.target.checked });
  };

  return (
    <CheckBox
      onChange={handleChange}
      checkedOnMount={PgPreferences.state.showTxDetailsInTerminal}
    />
  );
};

export default ShowTxDetailsSetting;
