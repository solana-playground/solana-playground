import { Tutorial } from "../../components/Tutorial";

const Template = () => (
  <Tutorial
    // About section that will be shown under the description of the tutorial page
    about={require("./about.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      { content: require("./pages/1.md"), title: "1/8" },
      { content: require("./pages/2.md"), title: "2/8" },
      { content: require("./pages/3.md"), title: "3/8" },
      { content: require("./pages/4.md"), title: "4/8" },
      { content: require("./pages/5.md"), title: "5/8" },
      { content: require("./pages/6.md"), title: "6/8" },
      { content: require("./pages/7.md"), title: "7/8" },
      { content: require("./pages/8.md"), title: "8/8" },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[
      ["src/lib.rs", require("./files/lib.rs")],
      ["client/client.ts", require("./files/client.ts.raw")],
      ["tests/index.test.ts", require("./files/anchor.test.ts.raw")],
    ]}
  />
);

export default Template;
