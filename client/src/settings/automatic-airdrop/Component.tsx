import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const PreflightSetting = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.wallet.automaticAirdrop = ev.target.checked;
    }}
    defaultChecked={PgSettings.wallet.automaticAirdrop}
  />
);

export default PreflightSetting;
