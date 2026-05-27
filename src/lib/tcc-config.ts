export const CACHE_TTL_IN_SECONDS = 60 * 60 * 24;

export function buildComparisonCacheKey(carItems: string[]) {
  return `comparison:${JSON.stringify(carItems)}`;
}
