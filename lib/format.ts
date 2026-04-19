export function formatDisplayDate(value: string | null) {
  if (!value) {
    return "A definir";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}
