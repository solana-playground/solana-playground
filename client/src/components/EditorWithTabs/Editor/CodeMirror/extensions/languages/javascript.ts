import { javascript } from "@codemirror/lang-javascript";

export const javascriptExtensions = (isTypescript: boolean) => {
  return [javascript({ typescript: isTypescript })];
};
