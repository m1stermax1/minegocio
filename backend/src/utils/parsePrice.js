export function parsePrice(value) {
  if (value === null || value === undefined) return 0;
  const s = value.toString().trim();
  if (s === "") return 0;
  // remove non-breaking spaces and whitespace
  const cleaned = s.replace(/\u00A0/g, "").replace(/\s+/g, "");
  // remove thousands separators (dots) and convert comma decimal to dot
  const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
