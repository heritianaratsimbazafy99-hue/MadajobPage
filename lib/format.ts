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

export function formatFileSize(value: number | null) {
  if (!value || value <= 0) {
    return "Taille inconnue";
  }

  const units = ["o", "Ko", "Mo", "Go"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}
