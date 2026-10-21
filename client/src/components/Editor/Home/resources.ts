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
    name: "Cookbook",
    description:
      "Detailed explanations and guides for building applications on Solana.",
    url: "https://solanacookbook.com/",
    icon: "https://solanacookbook.com/solana_cookbook_darkmode.svg",
  },
  {
    name: "Metaplex Docs",
    description:
      "Documentation for understanding how to work with NFTs on Solana using the Metaplex Standards.",
    url: "https://developers.metaplex.com/",
    icon: ROOT_DIR + "metaplex.png",
  },
];
