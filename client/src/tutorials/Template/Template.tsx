import { Tutorial } from "../../components/Tutorial";
import { Files } from "../../utils/pg";

// Main markdown text to show as the preview and introduction to the tutorial
const main = require("./Main.md");

// Actual tutorial pages to show next to the editor
const page1 = require("./pages/1.md");
const page2 = require("./pages/2.md");
const page3 = require("./pages/3.md");
const pages = [page1, page2, page3];

// Initial files to have at the beginning of the tutorial
const files: Files = [
  ["src/lib.rs", require("./files/lib.rs")],
  ["client/client.ts", require("./files/client.ts.raw")],
];

const FirstTutorial = () => (
  <Tutorial main={main} pages={pages} files={files} />
);

export default FirstTutorial;
