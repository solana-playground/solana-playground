import NewWallet from "../Modals/NewWallet";
import { PgView } from "../../../utils/pg";

export const useNewWallet = () => {
  return {
    handleNewWallet: async () => {
      await PgView.setModal(NewWallet);
    },
  };
};
