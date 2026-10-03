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
    url: "https://solana.com/developers/cookbook",
    icon: "https://solanacookbook.com/solana_cookbook_darkmode.svg",
  },
  {
    name: "Developer Courses",
    description:
      "Structured courses covering Solana development fundamentals and beyond.",
    url: "https://github.com/solana-foundation/developer-content/tree/main/content/courses",
    icon: ROOT_DIR + "soldev.png",
  },
  {
    name: "Metaplex Docs",
    description:
      "Documentation for understanding how to work with NFTs on Solana using the Metaplex Standards.",
    url: "https://www.metaplex.com/docs/",
    icon: ROOT_DIR + "metaplex.png",
  },
];
