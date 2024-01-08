import { ChangeEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { Arrayable, PgCommon, PgRouter } from "../utils/pg";

type Filterable = { name: string; featured?: boolean } & Record<string, any>;

interface FilterSearchProps<T extends Filterable> {
  /** Global route path */
  route: RoutePath;
  /** All filterable items */
  items: T[];
  /** All filters */
  filters: Readonly<Array<{ param: string }>>;
  /** Sort function for the items */
  sort: (a: T, b: T) => number;
}

export const useFilteredSearch = <T extends Filterable>({
  route,
  items,
  filters,
  sort,
}: FilterSearchProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // If the user clicks an item, the `pathname` will be the item's path.
  // This causes flickering when filters are applied before the click because
  // filters will get reset before the component unmounts which makes the
  // unfiltered items show up just before the component unmounts.
  // TODO: Make sure routes don't leak
  const { pathname } = useLocation();
  if (!PgRouter.isPathsEqual(pathname, route)) return null;

  const search = searchParams.get(SEARCH_PARAM) ?? "";
  const queries = filters.map((f) => ({
    key: f.param,
    value: searchParams.getAll(f.param),
  }));
  const [featuredItems, regularItems] = PgCommon.filterWithRemaining(
    items
      .filter((item) => {
        return (
          item.name.toLowerCase().includes(search.toLowerCase()) &&
          queries.every((f) => filterQuery(f.value, item[f.key]))
        );
      })
      .sort(sort),
    (t) => t.featured
  );

  return {
    featuredItems,
    regularItems,
    searchBarProps: {
      value: search,
      onChange: (ev: ChangeEvent<HTMLInputElement>) => {
        const value = ev.target.value;
        if (!value) searchParams.delete(SEARCH_PARAM);
        else searchParams.set(SEARCH_PARAM, value);

        setSearchParams(searchParams, { replace: true });
      },
    },
  };
};

const SEARCH_PARAM = "search";

/**
 * Filter the query based on the search values and the item values.
 *
 * @param searchValues values in the URL
 * @param itemValues values declared for the item
 * @returns whether the item passes the checks
 */
const filterQuery = (
  searchValues: Arrayable<string>,
  itemValues: Arrayable<string> = []
) => {
  searchValues = PgCommon.toArray(searchValues);
  itemValues = PgCommon.toArray(itemValues);
  return (
    !searchValues.length ||
    (!!itemValues.length && searchValues.some((v) => itemValues.includes(v)))
  );
};
