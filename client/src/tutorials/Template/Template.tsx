import { FC } from "react";

import Tutorial, { TutorialProps } from "../../components/Tutorial";

const page1 = `# Hello1, *world*!`;
const page2 = `# Hello2, *world*!`;
const page3 = `# Hello3, *world*!`;

const main = require("./Main.md");

const FirstTutorial: FC<TutorialProps> = (props) => {
  return <Tutorial {...props} main={main} pages={[page1, page2, page3]} />;
};

export default FirstTutorial;
