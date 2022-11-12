import BN from "bn.js";
import { useEffect } from "react";

export const useBigNumberJson = () => {
  useEffect(() => {
    // The default BN.toJSON is a hex string, but we want a readable string
    // Temporarily change it to use a plain toString while this component is mounted
    const oldBNPrototypeToJSON = BN.prototype.toJSON;
    BN.prototype.toJSON = function (this: BN) {
      return this.toString();
    };

    // Change the toJSON prototype back on unmount
    return () => {
      BN.prototype.toJSON = oldBNPrototypeToJSON;
    };
  }, []);
};
