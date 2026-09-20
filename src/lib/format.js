export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const signedPct = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  const rounded = Math.round(number);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

export const initials = (name) =>
  String(name || "Family")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.categories)) return value.categories;
  if (Array.isArray(value?.months)) return value.months;
  return [];
};

export const today = () => new Date().toISOString().slice(0, 10);

export const monthKey = (date) => String(date || "").slice(0, 7);

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
