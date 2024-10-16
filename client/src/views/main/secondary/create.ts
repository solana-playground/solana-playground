import { CallableJSX, PgCommon, RequiredKey } from "../../../utils/pg";

/** Secondary main view page parameter */
type MainSecondaryPageParam<N extends string> = {
  /** Name of the page */
  name: N;
  /** Title of the page, defaults to `name` */
  title?: string;
  /** Keybind for the page */
  keybind?: string;
  /** Actions available for the page */
  actions?: Array<{
    /** Action name */
    name: string;
    /** Action keybind */
    keybind?: string;
    /** Action icon */
    icon: JSX.Element;
    /** Action processor */
    run: () => void;
  }>;
  /** Lazy loader for the element */
  importElement?: () => Promise<{ default: CallableJSX }>;
  /** Get whether the page is in focus */
  getIsFocused: () => boolean;
  /** Focus the page */
  focus: () => void;
};

/** Created sidebar page */
type MainSecondaryPage<N extends string> = RequiredKey<
  MainSecondaryPageParam<N>,
  "title" | "importElement"
>;

/**
 * Create a secondary main view page.
 *
 * @param page secondary main view page
 * @returns the page with correct types
 */
export const createMainSecondaryPage = <N extends string>(
  page: MainSecondaryPageParam<N>
) => {
  page.title ??= page.keybind ? `${page.name} (${page.keybind})` : page.name;
  page.importElement ??= () => {
    return import(
      `./${PgCommon.toKebabFromTitle(page.name.replace("& ", ""))}/Component`
    );
  };
  return page as MainSecondaryPage<N>;
};
