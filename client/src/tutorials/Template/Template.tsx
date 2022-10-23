import { Tutorial } from "../../components/Tutorial";

const FirstTutorial = () => (
  <Tutorial
    // Main markdown text to show as the preview and introduction to the tutorial
    main={require("./Main.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      { content: require("./pages/1.md"), title: "Page 1" },
      { content: require("./pages/2.md"), title: "Page 2" },
      { content: require("./pages/3.md"), title: "Page 3" },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[
      ["src/lib.rs", require("./files/lib.rs")],
      ["client/client.ts", require("./files/client.ts.raw")],
    ]}
  />
);

export default FirstTutorial;
