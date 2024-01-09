import Panels from "./Panels";
import Global from "./Global";
import Helpers from "./Helpers";
import Delayed from "../../components/Delayed";
import FadeIn from "../../components/FadeIn";

const IDE = () => (
  <FadeIn>
    <Panels />
    <Global />
    <Delayed delay={1000}>
      <Helpers />
    </Delayed>
  </FadeIn>
);

export default IDE;
