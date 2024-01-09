import type { SyncOrAsync } from "../types";

/**
 * Run the given `migrate` function as soon as the static class module has been
 * imported.
 *
 * Migration is useful for making changes to how the data is stored.
 */
export function migratable(migrate: () => SyncOrAsync<void>) {
  migrate();
  return (_sClass: any) => {};
}
