export function formatDate(date: string | null | undefined) {
  if (!date) return "";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
