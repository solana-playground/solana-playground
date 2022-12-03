import { Tutorial } from "../../components/Tutorial";
import { PgExplorer, PgView, Sidebar } from "../../utils/pg";

const HelloSeahorse = () => (
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
          PgView.setSidebarState(Sidebar.BUILD_DEPLOY);
        },
      },
      {
        content: require("./pages/3.md"),
        title: "Client",
        onMount: async () => {
          // Switch sidebar state to Explorer
          PgView.setSidebarState(Sidebar.EXPLORER);

          // Create client.ts file
          const explorer = await PgExplorer.get();
          const clientPath = "client/client.ts";
          const clientExists = await explorer.exists(clientPath);
          if (!clientExists) {
            await explorer.newItem(
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
          PgView.setSidebarState(Sidebar.TEST);
        },
      },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[["src/hello.py", require("./files/hello.py")]]}
  />
);

export default HelloSeahorse;
