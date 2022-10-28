import { Tutorial } from "../../components/Tutorial";

const Template = () => (
  <Tutorial
    // About section that will be shown under the description of the tutorial page
    about={require("./about.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      { content: require("./pages/1.md"), title: "1/10" },
      { content: require("./pages/2.md"), title: "2/10" },
      { content: require("./pages/3.md"), title: "3/10" },
      { content: require("./pages/4.md"), title: "4/10" },
      { content: require("./pages/5.md"), title: "5/10" },
      { content: require("./pages/6.md"), title: "6/10" },
      { content: require("./pages/7.md"), title: "7/10" },
      { content: require("./pages/8.md"), title: "8/10" },
      { content: require("./pages/9.md"), title: "9/10" },
      { content: require("./pages/10.md"), title: "10/10"},
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
