export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const TCC_ALLOWED_CARS = [
  { model: 'Byd Dolphin Mini', year: 2025 },
  { model: 'Byd Dolphin Mini', year: 2024 },
  { model: 'Byd Dolphin Plus', year: 2024 },
  { model: 'Byd Dolphin Plus', year: 2025 },
] as const;

export const TCC_ALLOWED_CAR_ITEMS = TCC_ALLOWED_CARS.map(
  (car) => `${car.model}, ${car.year}`,
);

export function isTccCacheOnlyEnabled() {
  return process.env.OPENAI_CACHE_ONLY === 'true';
}

export function buildTccComparisonCacheKey(carItems: string[]) {
  return `tcc_comparison:${JSON.stringify(carItems)}`;
}

export function matchesTccAllowedCars(carItems: string[]) {
  return (
    carItems.length === TCC_ALLOWED_CAR_ITEMS.length &&
    carItems.every((item, index) => item === TCC_ALLOWED_CAR_ITEMS[index])
  );
}

export function normalizeVehicleText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
