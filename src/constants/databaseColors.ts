export const DATABASE_COLORS: Record<string, string> = {
  Oracle: '#FBD982',
  Redis: '#DC382C',
};

export const DEFAULT_DB_COLOR = 'hsl(142, 71%, 45%)';

export function getDbColor(subType?: string): string {
  if (!subType) return DEFAULT_DB_COLOR;
  return DATABASE_COLORS[subType] ?? DEFAULT_DB_COLOR;
}
