import Checkbox from "../../components/Checkbox";
import { PgSettings } from "../../utils/pg";

const ShowTransactionNotifications = () => (
  <Checkbox
    onChange={(ev) => {
      PgSettings.notification.showTx = ev.target.checked;
    }}
    defaultChecked={PgSettings.notification.showTx}
  />
);

export default ShowTransactionNotifications;
