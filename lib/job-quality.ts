import type { ManagedJob } from "@/lib/types";
import { hasVisibleSalary } from "@/lib/job-salary";

export type JobQualityAlertKey =
  | "vague_title"
  | "missing_skills"
  | "missing_salary"
  | "missing_closing_date";

export type JobQualityInput = Partial<
  Pick<
    ManagedJob,
    | "title"
    | "summary"
    | "responsibilities"
    | "requirements"
    | "benefits"
    | "closing_at"
    | "salary_min"
    | "salary_max"
    | "salary_currency"
    | "salary_period"
    | "salary_is_visible"
  >
>;

export type JobQualityAlert = {
  key: JobQualityAlertKey;
  label: string;
  description: string;
  weight: number;
};

export type JobQualityReport = {
  score: number;
  label: string;
  tone: "success" | "info" | "warning" | "danger";
  readyForPublication: boolean;
  alerts: JobQualityAlert[];
  strengths: string[];
};

const vagueTitleWords = new Set([
  "assistant",
  "cadre",
  "chauffeur",
  "commercial",
  "consultant",
  "developpeur",
  "manager",
  "responsable",
  "stagiaire",
  "technicien",
  "vendeur"
]);

const skillPattern =
  /\b(anglais|b2b|crm|excel|experience|gestion|logiciel|maitrise|management|negociation|outil|outils|prospection|reporting|sql|vente)\b/i;
const salaryPattern =
  /\b(ariary|avantage|avantages|brut|eur|fixe|fourchette|mga|net|package|prime|primes|remuneration|salaire|variable)\b|€|\$/i;

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getWordCount(value?: string | null) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasClosingDate(value?: string | null) {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function getJobQualityLabel(score: number): Pick<JobQualityReport, "label" | "tone"> {
  if (score >= 85) {
    return { label: "Pret a publier", tone: "success" };
  }

  if (score >= 70) {
    return { label: "A renforcer", tone: "info" };
  }

  if (score >= 50) {
    return { label: "Risque de faible conversion", tone: "warning" };
  }

  return { label: "Incomplet", tone: "danger" };
}

export function getJobQualityReport(input: JobQualityInput): JobQualityReport {
  const title = normalizeText(input.title);
  const titleWordCount = getWordCount(input.title);
  const content = [
    input.summary,
    input.responsibilities,
    input.requirements,
    input.benefits
  ].join(" ");
  const normalizedContent = normalizeText(content);
  const requirementsText = normalizeText(input.requirements);
  const benefitsText = normalizeText(input.benefits);
  const alerts: JobQualityAlert[] = [];
  const strengths: string[] = [];

  if (
    title.length < 12 ||
    titleWordCount < 2 ||
    vagueTitleWords.has(title)
  ) {
    alerts.push({
      key: "vague_title",
      label: "Titre trop vague",
      description: "Precisez le metier, le niveau ou le contexte pour mieux convertir les candidats.",
      weight: 20
    });
  } else {
    strengths.push("Titre assez precis pour etre compris rapidement.");
  }

  if (requirementsText.length < 32 && !skillPattern.test(normalizedContent)) {
    alerts.push({
      key: "missing_skills",
      label: "Competences manquantes",
      description: "Ajoutez les competences, outils, langues ou experiences vraiment attendus.",
      weight: 30
    });
  } else {
    strengths.push("Competences ou exigences exploitables pour le matching.");
  }

  if (!hasVisibleSalary(input) && !salaryPattern.test(benefitsText) && !salaryPattern.test(normalizedContent)) {
    alerts.push({
      key: "missing_salary",
      label: "Salaire absent",
      description: "Ajoutez une remuneration, une fourchette, un package ou au minimum un variable.",
      weight: 20
    });
  } else {
    strengths.push("Signal remuneration ou package detecte.");
  }

  if (!hasClosingDate(input.closing_at)) {
    alerts.push({
      key: "missing_closing_date",
      label: "Date de cloture absente",
      description: "Fixez une date cible pour piloter la diffusion et eviter les offres qui trainent.",
      weight: 15
    });
  } else {
    strengths.push("Date de cloture disponible pour le pilotage.");
  }

  const score = Math.max(
    0,
    100 - alerts.reduce((total, alert) => total + alert.weight, 0)
  );
  const labelMeta = getJobQualityLabel(score);

  return {
    score,
    ...labelMeta,
    readyForPublication: alerts.length === 0,
    alerts,
    strengths
  };
}

export function getJobPublicationBlockerMessage(report: JobQualityReport) {
  if (report.readyForPublication) {
    return "";
  }

  return `Avant publication, renforcez l'annonce : ${report.alerts
    .map((alert) => alert.label.toLowerCase())
    .join(", ")}.`;
}
