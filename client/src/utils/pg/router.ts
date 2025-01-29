import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { Disposable, SyncOrAsync } from "./types";

/** Opening delimiter for path variables */
const OPEN = "{";

/** Closing delimiter for path variables */
const CLOSE = "}";

/** Custom route */
type Route<P extends string> = {
  /** Route pathname, always starts with `/` */
  path: P;
  /** Handler method for the route */
  handle: (params: PathParameter<P>) => SyncOrAsync<Disposable | void>;
  /** Check whether the path is valid */
  validate?: (params: PathParameter<P>) => boolean;
};

/** Utility type to get the variable names from the given path */
type PathVariable<T extends string> =
  T extends `${string}${typeof OPEN}${infer V}${typeof CLOSE}${infer R}`
    ? R extends ""
      ? PathVariable<V>
      : PathVariable<V> | PathVariable<R>
    : T;

/** Map the variables to an object with `string` values */
type PathParameter<T extends string> = { [K in PathVariable<T>]: string };

export class PgRouter {
  /** URL information about the page */
  static location = window.location;

  /**
   * Initialize the router.
   *
   * @param routes all available routes
   * @returns a dispose function to clear the event
   */
  static init<P extends string>(routes: Route<P>[]) {
    let disposable: Disposable | undefined;
    return this.onDidChangePath(async (path) => {
      // Dispose
      disposable?.dispose();

      let params: PathParameter<P>;
      const route = routes.find((route) => {
        try {
          params = this._getParamsFromPath(route.path, path);
          if (route.validate) return route.validate(params);
          return true;
        } catch {
          return false;
        }
      });

      try {
        disposable = (await route?.handle(params!))!;
      } catch (e: any) {
        console.log("ROUTE ERROR:", e.message);
        this.navigate();
      }
    });
  }

  /**
   * Create a route with inferred types.
   *
   * @param route route to create
   * @returns the same route with inferred types
   */
  static create<P extends string>(route: Route<P>) {
    return route;
  }

  /**
   * Navigate to the given path.
   *
   * This method will only navigate if the given path is different than the
   * current path.
   *
   * @param path pathname to navigate to
   */
  static navigate(path: RoutePath = "/") {
    const { pathname, search } = this.location;
    if (!this.isPathsEqual(pathname + search, path)) {
      PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
    }
  }

  /**
   * Compare pathnames to each other.
   *
   * @param pathOne first path
   * @param pathTwo second path
   * @returns whether the paths are equal
   */
  static isPathsEqual(pathOne: RoutePath, pathTwo: RoutePath) {
    return PgCommon.isPathsEqual(pathOne, pathTwo);
  }

  /**
   * Runs after path change.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidChangePath(cb: (path: RoutePath) => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.ROUTER_ON_DID_CHANGE_PATH,
    });
  }

  /**
   * Get the custom parameters from the given path.
   *
   * ### Example:
   *
   * ```ts
   * const params = _getParamsFromPath("/tutorials/{tutorialName}", "/tutorials/hello-anchor");
   * console.log(params); // { tutorialName: "hello-anchor" }
   * ```
   *
   * @param routePath playground route
   * @param path current path
   * @returns the parameters as key-value
   */
  private static _getParamsFromPath<P extends string>(
    routePath: P,
    path: string
  ): PathParameter<P> {
    const result: Record<string, string> = {};

    const recursivelyMapValues = (subPath: string, index = 0) => {
      const templatePath = routePath.substring(index);
      if (!templatePath) return;

      // Get the matching parts
      const startIndex = templatePath.indexOf(OPEN);
      if (startIndex === -1) {
        if (PgRouter.isPathsEqual(templatePath, subPath)) return {};

        throw new Error("Doesn't match");
      }

      const startsWith = templatePath
        .slice(0, startIndex)
        .startsWith(subPath.slice(0, startIndex));
      if (!startsWith) throw new Error("Doesn't match");

      // Remove matching parts
      subPath = subPath.slice(startIndex);

      const relativeEndIndex = templatePath
        .substring(startIndex)
        .indexOf(CLOSE);
      if (relativeEndIndex === -1) throw new Error("No closing curly");
      const endIndex = startIndex + relativeEndIndex;

      const prop = templatePath.substring(startIndex + 1, endIndex);

      // Check whether the closing index is the last index
      if (endIndex === templatePath.length - 1) {
        if (!subPath.startsWith("/")) {
          result[prop] = subPath;

          return;
        }

        throw new Error("Doesn't match");
      }

      // Get the next template character
      const nextTemplateCharacter = templatePath.at(endIndex + 1);
      if (nextTemplateCharacter) {
        const nextIndex = subPath.indexOf(nextTemplateCharacter);
        result[prop] =
          nextIndex === -1 ? subPath : subPath.substring(0, nextIndex);

        recursivelyMapValues(
          subPath.substring(result[prop].length),
          index + endIndex + 1
        );
      }
    };

    recursivelyMapValues(path);

    return result as PathParameter<P>;
  }
}

// Tests
if (process.env.NODE_ENV !== "production") {
  // @ts-expect-error
  const test = PgRouter._getParamsFromPath;
  const assertMatches = (
    route: string,
    path: string,
    expectedParams: object = {}
  ) => {
    const actualParams = test(route, path);
    if (!PgCommon.isEqual(expectedParams, actualParams)) {
      throw new Error(
        [
          `Route: ${route} and ${path} mismatch:`,
          `expected (${PgCommon.prettyJSON(expectedParams)})`,
          `actual: ${PgCommon.prettyJSON(actualParams)}`,
        ].join("\n")
      );
    }
  };
  const assertNoMatches = (route: string, path: string) => {
    const msg = `Route ${route} and path ${path} did not throw`;
    try {
      test(route, path);
      throw new Error(msg);
    } catch (e: any) {
      if (e.message === msg) throw e;
    }
  };

  assertMatches("/", "/");
  assertMatches("/tutorials", "/tutorials");
  assertMatches("/tutorials", "/tutorials/");
  assertMatches("/tutorials/{name}", "/tutorials/first", {
    name: "first",
  });
  assertMatches("/tutorials/{name}", "/tutorials/first/1", {
    name: "first/1",
  });
  assertMatches("/tutorials/{name}/{page}", "/tutorials", {
    name: "",
    page: "",
  });
  assertMatches("/tutorials/{name}/{page}", "/tutorials/first", {
    name: "first",
    page: "",
  });
  assertMatches("/tutorials/{name}/{page}", "/tutorials/first/", {
    name: "first",
    page: "",
  });
  assertMatches("/tutorials/{name}/{page}", "/tutorials/first/1", {
    name: "first",
    page: "1",
  });
  assertNoMatches("/tutorials", "/");
  assertNoMatches("/tutorials", "/programs");
  assertNoMatches("/tutorials/", "/programs");
  assertNoMatches("/tutorials/{name}", "/programs");
  assertNoMatches("/tutorials/{name}/{page}", "/programs");
}
