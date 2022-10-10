import { COLLECTIONS_FEATURE_INDEX } from "../constants";

export const isFeatureActive = (uuid: string, featureIndex: number) => {
  const uuidBuffer = Buffer.from(uuid);
  if (
    featureIndex === COLLECTIONS_FEATURE_INDEX &&
    uuidBuffer[featureIndex] === Buffer.from("1")[0]
  ) {
    return isValidUuid(uuid);
  } else {
    return uuidBuffer[featureIndex] === Buffer.from("#")[0];
  }
};

const isValidUuid = (uuid: string) => {
  return !Buffer.from(uuid).every(
    (b) =>
      b !== Buffer.from("1")[0] &&
      b !== Buffer.from("0")[0] &&
      b !== Buffer.from("#")[0]
  );
};
