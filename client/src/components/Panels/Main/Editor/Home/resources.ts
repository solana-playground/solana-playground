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
    title: "Anchor Book",
    text: "Everything related to developing on Solana with Anchor framework.",
    url: "https://book.anchor-lang.com/",
    src: "https://camo.githubusercontent.com/0542190d13e5a50f7d601abc4bfde84cf02af2ca786af519e78411f43f3ca9c0/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f3831333434343531343934393130333635382f3839303237383532303535333630333039322f6578706f72742e706e673f77696474683d373436266865696768743d373436",
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
    text: "The core Metaplex documentation used to provide understanding and implementations for building with NFTs on Solana.",
    url: "https://docs.metaplex.com/",
    src: ROOT_DIR + "metaplex.png",
  },
];
