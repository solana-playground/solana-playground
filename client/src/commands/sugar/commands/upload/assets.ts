import { JsonMetadata } from "@metaplex-foundation/js";

import { SugarUploadScreen } from "./SugarUploadScreen";
import { CacheItem } from "../../utils";
import { PgBytes, PgCommon, PgView } from "../../../../utils/pg";

class AssetPair {
  name: string;
  metadata: string;
  metadata_hash: string;
  image: string;
  image_hash: string;
  animation?: string;
  animation_hash?: string;

  constructor(
    name: string,
    metadata: string,
    metadataHash: string,
    image: string,
    imageHash: string,
    animation?: string,
    animationHash?: string
  ) {
    this.name = name;
    this.metadata = metadata;
    this.metadata_hash = metadataHash;
    this.image = image;
    this.image_hash = imageHash;
    this.animation = animation;
    this.animation_hash = animationHash;
  }

  intoCacheItem() {
    return new CacheItem({
      name: this.name,
      metadata_link: this.metadata,
      metadata_hash: this.metadata_hash,
      image_link: this.image,
      image_hash: this.image_hash,
      animation_link: this.animation,
      animation_hash: this.animation_hash,
      onChain: false,
    });
  }
}

type GetAssetPairsResult = { assetPairs: [number, AssetPair][]; files: File[] };

const COLLECTION_FILENAME = "collection";

export const getAssetPairs = async (): Promise<GetAssetPairsResult> => {
  const files: File[] | null = await PgView.setModal(SugarUploadScreen, {
    title: "Upload Assets",
  });
  if (!files) throw new Error("You haven't selected files.");

  // Sort files based on their name
  files.sort((a, b) => a.name.localeCompare(b.name));
  const fileNames = files.map((f) => f.name);

  const animationExistsRegex = /^(.+)\.((mp3)|(mp4)|(mov)|(webm)|(glb))$/;

  // Since there doesn't have to be video for each image/json pair, need to get rid of
  // invalid file fileNames before entering metadata filename loop
  for (const fileName in fileNames) {
    const exec = animationExistsRegex.exec(fileName);
    if (exec && exec[1] !== COLLECTION_FILENAME && PgCommon.isInt(exec[1])) {
      throw new Error(
        `Couldn't parse filename '${fileName}' to a valid index number.`
      );
    }
  }

  const metadatafileNames = fileNames.filter((f) =>
    f.toLowerCase().endsWith(".json")
  );
  if (!metadatafileNames.length) {
    throw new Error("Could not find any metadata .json files.");
  }

  const result: GetAssetPairsResult = { assetPairs: [], files };

  for (const metadataFileName of metadatafileNames) {
    const i = metadataFileName.split(".")[0];
    const isCollectionIndex = i === COLLECTION_FILENAME;

    let index;
    if (isCollectionIndex) index = -1;
    else if (PgCommon.isInt(i)) index = parseInt(i);
    else {
      throw new Error(
        `Couldn't parse filename '${metadataFileName}' to a valid index number.,`
      );
    }

    const imgRegex = new RegExp(`^${i}\\.(jpg|jpeg|gif|png)$`, "i");
    const imgFileNames = fileNames.filter((f) => imgRegex.test(f));

    if (imgFileNames.length !== 1) {
      throw new Error(
        isCollectionIndex
          ? "Couldn't find the collection image filename."
          : `Couldn't find an image filename at index ${i}.`
      );
    }

    const imgFileName = imgFileNames[0];
    const imgHash = encode(imgFileName);

    // Need a similar check for animation as above, this one checking if there is
    // animation on specific index
    const animationRegex = new RegExp(`^${i}\\.(mp3|mp4|mov|webm|glb)$`, "i");

    const animationfileNames = fileNames.filter((f) => animationRegex.test(f));
    const animationFileName =
      animationfileNames.length === 1 ? animationfileNames[0] : undefined;
    const animationHash = animationFileName
      ? encode(animationFileName)
      : undefined;

    const metadataHash = encode(metadataFileName);
    const metadata: JsonMetadata = JSON.parse(
      await files.find((f) => f.name === metadataFileName)!.text()
    );
    const name = metadata.name;
    if (!name) {
      throw new Error(
        `'name' is not specified in metadata file ${metadataFileName}`
      );
    }

    result.assetPairs.push([
      index,
      new AssetPair(
        name,
        metadataFileName,
        metadataHash,
        imgFileName,
        imgHash,
        animationFileName,
        animationHash
      ),
    ]);
  }

  return result;
};

/** Encode with SHA-256 hash algorithm. */
const encode = PgBytes.hashSha256;
