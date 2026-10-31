export interface ResourceProps {
  name: string;
  description: string;
  url: string;
  icon: string;
  circleImage?: boolean;
}

const ROOT_DIR = "/icons/platforms/";

export const RESOURCES: ResourceProps[] = [
  {
    name: "Metaplex Docs",
    description:
      "Documentation for understanding how to work with NFTs on Solana using the Metaplex Standards.",
    url: "https://developers.metaplex.com/",
    icon: ROOT_DIR + "metaplex.png",
  },
];
