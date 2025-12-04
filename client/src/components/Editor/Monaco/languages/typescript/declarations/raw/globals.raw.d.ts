declare global {
  /**
   * @param ms amount of time to sleep in milliseconds
   * @returns a promise that will resolve after specified ms
   */
  function sleep(ms?: number): Promise<void>;
}

export {};
