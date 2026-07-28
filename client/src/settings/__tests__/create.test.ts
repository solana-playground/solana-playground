import { createSetting } from "../create";

jest.mock("../../utils", () => ({
  PgCommon: {
    toTitleFromCamel: (s: string) => s,
    toKebabFromTitle: (s: string) => s,
    capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
    getValue: jest.fn(),
    setValue: jest.fn(),
  },
  PgSettings: {},
}));

describe("createSetting default resolution", () => {
  it("throws when default is empty string and values are set", () => {
    expect(() =>
      createSetting({
        id: "server.endpoint",
        values: [{ name: "Local", value: "http://localhost:8080" }],
        default: "",
      })
    ).toThrow("Setting must have a default value");
  });

  it("throws when default is undefined and values are set", () => {
    expect(() =>
      createSetting({
        id: "server.endpoint",
        values: [{ name: "Local", value: "http://localhost:8080" }],
      } as Parameters<typeof createSetting>[0])
    ).toThrow("Setting must have a default value");
  });

  it("falls back to `false` when default and values are both absent", () => {
    const setting = createSetting({ id: "wallet.automaticAirdrop" });

    expect(setting.default).toBe(false);
  });
});
