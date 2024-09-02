import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const AutomaticAirdrop = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.wallet.automaticAirdrop = ev.target.checked;
    }}
    defaultChecked={PgSettings.wallet.automaticAirdrop}
  />
);

export default AutomaticAirdrop;
