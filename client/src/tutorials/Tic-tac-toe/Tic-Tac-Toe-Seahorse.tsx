import { Tutorial } from "../../components/Tutorial";

const TicTacToe = () => (
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
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[
      ["src/lib.rs", require("./files/tictactoe.py")],
      ["client/client.ts", require("./files/client.ts.raw")],
      ["tests/index.test.ts", require("./files/index.test.ts.raw")],
    ]}
  />
);

export default TicTacToe;
