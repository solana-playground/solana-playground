declare global {
  interface Console {
    /**
     * Prints to `stderr` with newline. Multiple arguments can be passed, with the
     * first used as the primary message and all additional used as substitution
     * values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).
     *
     * ```js
     * const code = 5;
     * console.error('error #%d', code);
     * // Prints: error #5, to stderr
     * console.error('error', code);
     * // Prints: error 5, to stderr
     * ```
     *
     * If formatting elements (e.g. `%d`) are not found in the first string then `util.inspect()` is called on each argument and the resulting string
     * values are concatenated. See `util.format()` for more information.
     * @since v0.1.100
     */
    error(message?: any, ...optionalParams: any[]): void;

    /**
     * Prints to `stdout` with newline. Multiple arguments can be passed, with the
     * first used as the primary message and all additional used as substitution
     * values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).
     *
     * ```js
     * const count = 5;
     * console.info('count: %d', count);
     * // Prints: count: 5, to stdout
     * console.info('count:', count);
     * // Prints: count: 5, to stdout
     * ```
     *
     * See `util.format()` for more information.
     * @since v0.1.100
     */
    info(message?: any, ...optionalParams: any[]): void;

    /**
     * Prints to `stdout` with newline. Multiple arguments can be passed, with the
     * first used as the primary message and all additional used as substitution
     * values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).
     *
     * ```js
     * const count = 5;
     * console.log('count: %d', count);
     * // Prints: count: 5, to stdout
     * console.log('count:', count);
     * // Prints: count: 5, to stdout
     * ```
     *
     * See `util.format()` for more information.
     * @since v0.1.100
     */
    log(message?: any, ...optionalParams: any[]): void;

    /**
     * Prints to `stderr` with newline. Multiple arguments can be passed, with the
     * first used as the primary message and all additional used as substitution
     * values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).
     *
     * ```js
     * const code = 5;
     * console.warn('warn #%d', code);
     * // Prints: warn #5, to stderr
     * console.warn('warn', code);
     * // Prints: warn 5, to stderr
     * ```
     *
     * If formatting elements (e.g. `%d`) are not found in the first string then `util.inspect()` is called on each argument and the resulting string
     * values are concatenated. See `util.format()` for more information.
     * @since v0.1.100
     */
    warn(message?: any, ...optionalParams: any[]): void;
  }

  /**
   * The `console` module provides a simple debugging console that is similar to the
   * JavaScript console mechanism provided by web browsers.
   *
   * The module exports two specific components:
   *
   * * A `Console` class with methods such as `console.log()`, `console.error()` and`console.warn()` that can be used to write to any Node.js stream.
   * * A global `console` instance configured to write to `process.stdout` and `process.stderr`. The global `console` can be used without calling`require('console')`.
   *
   * _**Warning**_: The global console object's methods are neither consistently
   * synchronous like the browser APIs they resemble, nor are they consistently
   * asynchronous like all other Node.js streams. See the `note on process I/O` for
   * more information.
   *
   * Example using the global `console`:
   *
   * ```js
   * console.log('hello world');
   * // Prints: hello world, to stdout
   * console.log('hello %s', 'world');
   * // Prints: hello world, to stdout
   * console.error(new Error('Whoops, something bad happened'));
   * // Prints error message and stack trace to stderr:
   * //   Error: Whoops, something bad happened
   * //     at [eval]:5:15
   * //     at Script.runInThisContext (node:vm:132:18)
   * //     at Object.runInThisContext (node:vm:309:38)
   * //     at node:internal/process/execution:77:19
   * //     at [eval]-wrapper:6:22
   * //     at evalScript (node:internal/process/execution:76:60)
   * //     at node:internal/main/eval_string:23:3
   *
   * const name = 'Will Robinson';
   * console.warn(`Danger ${name}! Danger!`);
   * // Prints: Danger Will Robinson! Danger!, to stderr
   * ```
   *
   * Example using the `Console` class:
   *
   * ```js
   * const out = getStreamSomehow();
   * const err = getStreamSomehow();
   * const myConsole = new console.Console(out, err);
   *
   * myConsole.log('hello world');
   * // Prints: hello world, to out
   * myConsole.log('hello %s', 'world');
   * // Prints: hello world, to out
   * myConsole.error(new Error('Whoops, something bad happened'));
   * // Prints: [Error: Whoops, something bad happened], to err
   *
   * const name = 'Will Robinson';
   * myConsole.warn(`Danger ${name}! Danger!`);
   * // Prints: Danger Will Robinson! Danger!, to err
   * ```
   * @see [source](https://github.com/nodejs/node/blob/v16.4.2/lib/console.js)
   */
  namespace console {}
  var console: Console;
}

export {};
