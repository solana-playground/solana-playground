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
    title: "Anchor",
    text: "Everything related to developing on Solana with Anchor framework.",
    url: "https://www.anchor-lang.com/docs/quickstart/solpg",
    //  replace Anchor logo with updated version
    src: "https://raw.githubusercontent.com/nitriot/anchor-logo/main/anchor.png",
  },
  {
    title: "Seahorse",
    text: "Write Anchor-compatible Solana programs in Python.",
    url: "https://www.seahorse.dev/using-seahorse/accounts",
    src: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
    circleImage: true,
  },
  {
    title: "SolDev",
    text: "Solana content aggregator with easy discoverability for all your development needs.",
    name: "SolDev",
    description:
      "Solana content aggregator with easy discoverability for all your development needs.",
    url: "https://soldev.app/",
    icon: ROOT_DIR + "soldev.png",
  },
  {
    name: "Metaplex Docs",
    description:
      "Documentation for understanding how to work with NFTs on Solana using the Metaplex Standards.",
    url: "https://developers.metaplex.com/",
    icon: ROOT_DIR + "metaplex.png",
  },
];
