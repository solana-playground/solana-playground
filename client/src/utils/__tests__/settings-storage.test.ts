import { recoverStaleSameOriginEndpoint } from "../settings-recovery";
import type { Settings } from "../settings";

const make = (endpoint: unknown): Settings =>
  ({ server: endpoint === undefined ? undefined : { endpoint } } as Settings);

const defaultsLocalhost = make("http://localhost:8080");
const defaultsBff = make("");

describe("recoverStaleSameOriginEndpoint", () => {
  it("overrides persisted '' with defaults in a non-same-origin build", () => {
    const state = make("");
    const result = recoverStaleSameOriginEndpoint(
      state,
      defaultsLocalhost,
      false
    );

    expect(result.server.endpoint).toBe("http://localhost:8080");
  });

  it("leaves persisted '' alone in a same-origin BFF build", () => {
    const state = make("");
    const result = recoverStaleSameOriginEndpoint(state, defaultsBff, true);

    expect(result.server.endpoint).toBe("");
  });

  it("overrides persisted '' with a custom URL when defaults carries one", () => {
    const state = make("");
    const defaults = make("https://api.example.com");
    const result = recoverStaleSameOriginEndpoint(state, defaults, false);

    expect(result.server.endpoint).toBe("https://api.example.com");
  });

  it("leaves a non-empty persisted endpoint alone", () => {
    const state = make("https://user-chose-this.io");
    const result = recoverStaleSameOriginEndpoint(
      state,
      defaultsLocalhost,
      false
    );

    expect(result.server.endpoint).toBe("https://user-chose-this.io");
  });

  it("does not throw when state.server is missing", () => {
    const state = make(undefined);
    expect(() =>
      recoverStaleSameOriginEndpoint(state, defaultsLocalhost, false)
    ).not.toThrow();
  });
});
