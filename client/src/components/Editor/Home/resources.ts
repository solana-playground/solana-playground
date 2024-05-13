export interface ResourceProps {
  title: string;
  text: string;
  url: string;
  src: string;
  circleImage?: boolean;
}

const ROOT_DIR = "/icons/platforms/";

export const RESOURCES: ResourceProps[] = [
  {
    title: "Cookbook",
    text: "Detailed explanations and guides for building applications on AElf.",
    url: "https://solanacookbook.com/",
    src: "https://solanacookbook.com/solana_cookbook_darkmode.svg",
  },
];
