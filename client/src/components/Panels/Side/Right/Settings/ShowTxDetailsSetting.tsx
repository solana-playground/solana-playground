import { ChangeEvent } from "react";
import { PgPreferences } from "../../../../../utils/pg";
import CheckBox from "../../../../CheckBox";

const ShowTxDetailsInTerminal = () => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    PgPreferences.update({ showTxDetailsInTerminal: e.target.checked });
  };

  return (
    <CheckBox
      onChange={handleChange}
      checkedOnMount={PgPreferences.getPreferences().showTxDetailsInTerminal}
    />
  );
};

export default ShowTxDetailsInTerminal;
