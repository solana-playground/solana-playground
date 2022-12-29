import { BrowserRouter } from "react-router-dom";
import * as buffer from "buffer";

import MutThemeProvider from "./theme";
import SolanaProvider from "./components/SolanaProvider";
import IDE from "./pages/ide";

// Webpack 5 doesn't polyfill buffer
window.Buffer = buffer.Buffer;

const App = () => (
  <MutThemeProvider>
    <SolanaProvider>
      <BrowserRouter>
        <IDE />
      </BrowserRouter>
    </SolanaProvider>
  </MutThemeProvider>
);

export default App;
