import { Tutorial } from "../../components/Tutorial";
import { PgExplorer, PgView } from "../../utils/pg";

const HelloAnchor = () => (
  <Tutorial
    // About section that will be shown under the description of the tutorial page
    about={require("./about.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      { content: require("./pages/1.md"), title: "Program" },
      {
        content: require("./pages/2.md"),
        title: "Build & Deploy",
        onMount: () => {
          // Switch sidebar state to Build & Deploy
          PgView.setSidebarPage("Build & Deploy");
        },
      },
      {
        content: require("./pages/3.md"),
        title: "Client",
        onMount: async () => {
          // Switch sidebar state to Explorer
          PgView.setSidebarPage("Explorer");

          // Create client.ts file
          const clientPath = "client/client.ts";
          const clientExists = await PgExplorer.fs.exists(clientPath);
          if (!clientExists) {
            await PgExplorer.newItem(
              clientPath,
              require("./files/client.ts.raw")
            );
          }
        },
      },
      {
        content: require("./pages/4.md"),
        title: "Test UI",
        onMount: () => {
          // Switch sidebar state to Test
          PgView.setSidebarPage("Test");
        },
      },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[["src/lib.rs", require("./files/lib.rs")]]}
  />
);

export default HelloAnchor;
