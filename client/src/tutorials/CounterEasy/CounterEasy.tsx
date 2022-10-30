import { Tutorial } from "../../components/Tutorial";

const CounterEasy = () => (
  <Tutorial
    // About section that will be shown under the description of the tutorial page
    about={require("./about.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      { content: require("./pages/1.md") },
      { content: require("./pages/2.md") },
      { content: require("./pages/3.md") },
      { content: require("./pages/4.md") },
      { content: require("./pages/5.md") },
      { content: require("./pages/6.md") },
      { content: require("./pages/7.md") },
      { content: require("./pages/8.md") },
      { content: require("./pages/9.md") },
      { content: require("./pages/10.md") },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[
      ["src/lib.rs", require("./files/lib.rs")],
      ["tests/index.test.ts", require("./files/anchor.test.ts.raw")],
    ]}
  />
);

export default CounterEasy;
