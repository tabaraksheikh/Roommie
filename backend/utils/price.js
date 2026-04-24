function parseDecimalPrice(value) {
  if (value === undefined || value === null) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(2)) : NaN;

  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');

  if (!normalized) return NaN;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : NaN;
}

module.exports = {
  parseDecimalPrice,
};
