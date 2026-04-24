export type JobSalaryInput = {
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_is_visible?: boolean | null;
};

const currencyLabels: Record<string, string> = {
  EUR: "EUR",
  MGA: "MGA",
  USD: "USD"
};

const periodLabels: Record<string, string> = {
  day: "jour",
  hour: "heure",
  month: "mois",
  year: "an"
};

function formatSalaryAmount(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(value) + ` ${currencyLabels[currency] ?? currency}`;
}

export function hasVisibleSalary(input: JobSalaryInput) {
  return Boolean(input.salary_is_visible && (input.salary_min || input.salary_max));
}

export function formatJobSalary(input: JobSalaryInput) {
  if (!hasVisibleSalary(input)) {
    return "";
  }

  const currency = input.salary_currency || "MGA";
  const period = periodLabels[input.salary_period || "month"] ?? "mois";

  if (input.salary_min && input.salary_max && input.salary_min !== input.salary_max) {
    return `${formatSalaryAmount(input.salary_min, currency)} - ${formatSalaryAmount(input.salary_max, currency)} / ${period}`;
  }

  const amount = input.salary_min ?? input.salary_max;

  if (!amount) {
    return "";
  }

  return `${formatSalaryAmount(amount, currency)} / ${period}`;
}
