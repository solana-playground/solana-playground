import useCopyClipboard from "react-use-clipboard";

export const useCopy = (str: string): [boolean, () => void] => {
  const [copied, setCopied] = useCopyClipboard(str, {
    successDuration: 5000,
  });

  return [copied, setCopied];
};
