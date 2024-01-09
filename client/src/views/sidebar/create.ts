import { CallableJSX, PgCommon, RequiredKey } from "../../utils/pg";

/** Sidebar page param */
type SidebarPageParam<N extends string> = {
  /** Name of the page */
  name: N;
  /** `src` of the image */
  icon: string;
  /** Title of the page, defaults to `name` */
  title?: string;
  /** Keybind for the page */
  keybind?: string;
  /** Lazy loader for the element */
  importElement?: () => Promise<{ default: CallableJSX }>;
  /** Loading element to until the element is ready to show */
  LoadingElement?: CallableJSX;
};

/** Created sidebar page */
type SidebarPage<N extends string> = RequiredKey<
  SidebarPageParam<N>,
  "title" | "importElement"
>;

/**
 * Create a sidebar page.
 *
 * @param page sidebar page
 * @returns the page with correct types
 */
export const createSidebarPage = <N extends string>(
  page: SidebarPageParam<N>
) => {
  page.icon = "/icons/sidebar/" + page.icon;
  page.title ??= page.keybind ? `${page.name} (${page.keybind})` : page.name;
  page.importElement ??= () => {
    return import(
      `./${PgCommon.toKebabFromTitle(page.name.replace("& ", ""))}/Component`
    );
  };
  return page as SidebarPage<N>;
};
