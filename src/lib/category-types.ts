export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  topic_count: number;
  studied_count: number;
  pinned: boolean;
  pinned_at: string | null;
};

export const MAX_PINNED_CATEGORIES = 5;

export function sortCategories(items: CategoryRow[]): CategoryRow[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.pinned && b.pinned) {
      return (b.pinned_at ?? "").localeCompare(a.pinned_at ?? "");
    }
    return a.name.localeCompare(b.name);
  });
}
