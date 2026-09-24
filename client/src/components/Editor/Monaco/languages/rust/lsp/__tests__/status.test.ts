describe("lsp status — real document event bus", () => {
  let status: typeof import("../status");

  beforeEach(() => {
    jest.resetModules();
    status = require("../status");
  });

  it("should run the subscriber immediately with the current value", () => {
    const cb = jest.fn();
    const { dispose } = status.onDidChangeStatus(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("off");
    dispose();
  });

  it("should notify subscribers on change", () => {
    const cb = jest.fn();
    const { dispose } = status.onDidChangeStatus(cb);
    status.setStatus("connecting");
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith("connecting");
    dispose();
  });

  it("should not notify when the value is unchanged", () => {
    const cb = jest.fn();
    const { dispose } = status.onDidChangeStatus(cb);
    status.setStatus("off");
    expect(cb).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("should stop notifying after dispose", () => {
    const cb = jest.fn();
    const { dispose } = status.onDidChangeStatus(cb);
    dispose();
    status.setStatus("connected");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("should run the registered restart handler on request", () => {
    const restart = jest.fn();
    status.setRestartHandler(restart);
    status.requestRestart();
    expect(restart).toHaveBeenCalledTimes(1);
  });
});
