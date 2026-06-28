export const toNum = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') return value;
  return parseFloat(String(value ?? '')) || 0;
};

export const toInt = (value: string | number | undefined | null, fallback = 0): number => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};
