export interface ResourceProps {
  title: string;
  text: string;
  url: string;
  src: string;
}

const ROOT_DIR = "icons/platforms/";

export const RESOURCES: ResourceProps[] = [
  {
    title: "Cookbook",
    text: "Detailed explanations and guides for building applications on Solana.",
    url: "https://solanacookbook.com/",
    src: "https://solanacookbook.com/solana_cookbook_darkmode.svg",
  },
  {
    title: "Anchor",
    text: "Everything related to developing on Solana with Anchor framework.",
    url: "https://anchor-lang.com/",
    src: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=32&q=75",
  },
  {
    title: "SolDev",
    text: "Solana content aggregator with easy discoverability for all your development needs.",
    url: "https://soldev.app/",
    src: ROOT_DIR + "soldev.png",
  },
  {
    title: "Solana Docs",
    text: "The core Solana documentation used to provide deep understanding of Solana concepts.",
    url: "https://docs.solana.com/",
    src: ROOT_DIR + "solana.png",
  },
  {
    title: "Metaplex Docs",
    text: "Documentation for understanding how to work with NFTs on Solana.",
    url: "https://docs.metaplex.com/",
    src: ROOT_DIR + "metaplex.png",
  },
];
