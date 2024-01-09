import init, {
  initThreadPool,
  WorldState,
} from "@solana-playground/rust-analyzer";

(async () => {
  await init();

  // Thread pool initialization with the given number of threads
  // (pass `navigator.hardwareConcurrency` if you want to use all cores)
  // https://github.com/GoogleChromeLabs/wasm-bindgen-rayon
  await initThreadPool(navigator.hardwareConcurrency);

  const state = new WorldState();

  onmessage = (ev) => {
    const { method, args, id } = ev.data;
    const result = (state as any)[method](...args);
    postMessage({ id, result });
  };

  postMessage({ id: "ra-worker-ready" });
})();
