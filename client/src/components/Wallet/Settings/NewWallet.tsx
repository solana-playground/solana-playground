import NewWallet from "../Modals/NewWallet";
import { PgModal } from "../../../utils/pg";

export const useNewWallet = () => {
  return {
    handleNewWallet: () => {
      PgModal.set(NewWallet);
    },
  };
};
