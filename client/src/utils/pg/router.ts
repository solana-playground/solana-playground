import type { Location } from "react-router-dom";

import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { Disposable, OrString, SyncOrAsync } from "./types";

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
          params = this._getParamsFromPath(path, route.path);
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
   * Get the current location.
   *
   * @returns the current URL location
   */
  static async getLocation(): Promise<Location> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.ROUTER_LOCATION);
  }

  /**
   * Navigate to the given path.
   *
   * This method will only navigate if the given path is different than the
   * current path.
   *
   * @param path pathname to navigate to
   */
  static async navigate(path: OrString<RoutePath> = "/") {
    try {
      const location = await PgCommon.timeout(this.getLocation(), 200);
      if (!this.isPathsEqual(location.pathname + location.search, path)) {
        PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
      }
    } catch {
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
  static isPathsEqual(
    pathOne: OrString<RoutePath>,
    pathTwo: OrString<RoutePath>
  ) {
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
   * const params = _getParamsFromPath("/tutorials/hello-anchor", "/tutorials/{tutorialName}");
   * console.log(params); // { tutorialName: "hello-anchor" }
   * ```
   *
   * @param path current path
   * @param routePath playground route
   * @returns the parameters as key-value
   */
  private static _getParamsFromPath<P extends string>(
    path: string,
    routePath: P
  ): PathParameter<P> {
    const result: Record<string, string> = {};

    const recursivelyMapValues = (subPath: string, index = 0) => {
      const templatePath = routePath.substring(index);
      if (!templatePath) return;

      // Get the matching parts
      const startIndex = templatePath.indexOf(OPEN);
      if (startIndex === -1) {
        if (this.isPathsEqual(templatePath, subPath)) return {};

        throw new Error("Doesn't match");
      }

      // Remove matching parts
      if (subPath.slice(0, startIndex) === templatePath.slice(0, startIndex)) {
        subPath = subPath.slice(startIndex);
      }

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
        const newVal = (result[prop] = subPath.substring(
          0,
          subPath.indexOf(nextTemplateCharacter)
        ));

        recursivelyMapValues(
          subPath.substring(newVal.length),
          index + endIndex + 1
        );
      }
    };

    recursivelyMapValues(path);

    return result as PathParameter<P>;
  }
}
