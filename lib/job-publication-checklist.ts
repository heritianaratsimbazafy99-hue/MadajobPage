import { formatDisplayDate } from "@/lib/format";
import type { JobQualityReport } from "@/lib/job-quality";
import { formatJobSalary, hasVisibleSalary, type JobSalaryInput } from "@/lib/job-salary";
import type { ManagedJob } from "@/lib/types";

export type JobPublicationChecklistTone = "success" | "info" | "warning" | "danger" | "muted";

export type JobPublicationChecklistItem = {
  id: "quality" | "salary" | "closing" | "preview" | "status";
  label: string;
  value: string;
  description: string;
  complete: boolean;
  tone: JobPublicationChecklistTone;
  actionHref?: string;
  actionLabel?: string;
};

export type JobPublicationChecklist = {
  readyCount: number;
  totalCount: number;
  tone: JobPublicationChecklistTone;
  summary: string;
  items: JobPublicationChecklistItem[];
};

type JobPublicationChecklistJob = Pick<
  ManagedJob,
  "closing_at" | "published_at" | "slug" | "status"
> &
  JobSalaryInput;

type JobPublicationChecklistOptions = {
  editHref?: string;
  previewHref?: string;
  publicHref?: string;
  statusHref?: string;
};

function hasValidClosingDate(value?: string | null) {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function getStatusItem(
  job: JobPublicationChecklistJob,
  qualityReport: JobQualityReport,
  options: JobPublicationChecklistOptions
): JobPublicationChecklistItem {
  if (job.status === "published") {
    return {
      id: "status",
      label: "Statut diffusion",
      value: job.published_at ? `Publiee le ${formatDisplayDate(job.published_at)}` : "Publiee",
      description: "L'offre est visible dans les espaces candidat et sur la page carrieres.",
      complete: true,
      tone: "success",
      actionHref: options.publicHref,
      actionLabel: "Voir la page publique"
    };
  }

  if (job.status === "closed") {
    return {
      id: "status",
      label: "Statut diffusion",
      value: "Fermee",
      description: "L'offre n'est plus ouverte aux candidatures. Elle peut etre republiee si besoin.",
      complete: false,
      tone: "muted",
      actionHref: options.statusHref,
      actionLabel: "Gerer le statut"
    };
  }

  if (job.status === "archived") {
    return {
      id: "status",
      label: "Statut diffusion",
      value: "Archivee",
      description: "L'offre est sortie de la diffusion active. Restaurez-la avant une nouvelle publication.",
      complete: false,
      tone: "muted",
      actionHref: options.statusHref,
      actionLabel: "Restaurer l'offre"
    };
  }

  return {
    id: "status",
    label: "Statut diffusion",
    value: "Brouillon",
    description: qualityReport.readyForPublication
      ? "Le contenu est pret. Il reste a publier l'offre depuis le cycle de vie."
      : "Terminez les points bloquants avant de diffuser l'annonce.",
    complete: false,
    tone: qualityReport.readyForPublication ? "info" : "warning",
    actionHref: options.statusHref,
    actionLabel: "Publier l'offre"
  };
}

function getChecklistTone(readyCount: number, totalCount: number): JobPublicationChecklistTone {
  if (readyCount === totalCount) {
    return "success";
  }

  if (readyCount >= totalCount - 1) {
    return "info";
  }

  if (readyCount >= Math.ceil(totalCount / 2)) {
    return "warning";
  }

  return "danger";
}

export function getJobPublicationChecklist(
  job: JobPublicationChecklistJob,
  qualityReport: JobQualityReport,
  options: JobPublicationChecklistOptions = {}
): JobPublicationChecklist {
  const salaryLabel = formatJobSalary(job);
  const salaryIsVisible = hasVisibleSalary(job);
  const closingDateIsValid = hasValidClosingDate(job.closing_at);
  const editHref = options.editHref ?? "#job-edit-form";
  const previewHref = options.previewHref;
  const publicHref = options.publicHref ?? `/carrieres/${job.slug}`;
  const statusHref = options.statusHref ?? "#job-status-panel";

  const items: JobPublicationChecklistItem[] = [
    {
      id: "quality",
      label: "Score qualite",
      value: `${qualityReport.score}% - ${qualityReport.label}`,
      description: qualityReport.readyForPublication
        ? "Le titre, les exigences, la remuneration et la cloture donnent assez de signal."
        : `A renforcer : ${qualityReport.alerts.map((alert) => alert.label.toLowerCase()).join(", ")}.`,
      complete: qualityReport.readyForPublication,
      tone: qualityReport.readyForPublication ? "success" : qualityReport.tone,
      actionHref: qualityReport.readyForPublication ? undefined : editHref,
      actionLabel: qualityReport.readyForPublication ? undefined : "Corriger l'annonce"
    },
    {
      id: "salary",
      label: "Salaire visible",
      value: salaryLabel || "Non affiche",
      description: salaryIsVisible
        ? "La fourchette ou le montant sera visible par les candidats."
        : "Ajoutez un salaire visible pour augmenter la conversion et alimenter les alertes candidat.",
      complete: salaryIsVisible,
      tone: salaryIsVisible ? "success" : "warning",
      actionHref: salaryIsVisible ? undefined : editHref,
      actionLabel: salaryIsVisible ? undefined : "Ajouter le salaire"
    },
    {
      id: "closing",
      label: "Date de cloture",
      value: closingDateIsValid ? formatDisplayDate(job.closing_at ?? null) : "Non definie",
      description: closingDateIsValid
        ? "La diffusion a une echeance claire pour le suivi recruteur."
        : "Definissez une date cible pour eviter les offres qui restent ouvertes trop longtemps.",
      complete: closingDateIsValid,
      tone: closingDateIsValid ? "success" : "warning",
      actionHref: closingDateIsValid ? undefined : editHref,
      actionLabel: closingDateIsValid ? undefined : "Fixer une cloture"
    },
    {
      id: "preview",
      label: "Apercu public",
      value: job.status === "published" ? "Page publique disponible" : "Previsualisation disponible",
      description:
        "Relisez le rendu candidat avant diffusion, avec le contenu, le package et les sections detaillees.",
      complete: true,
      tone: job.status === "published" ? "success" : "info",
      actionHref: previewHref,
      actionLabel: "Ouvrir l'apercu"
    },
    getStatusItem(job, qualityReport, { publicHref, statusHref })
  ];

  const readyCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const remainingCount = totalCount - readyCount;

  return {
    readyCount,
    totalCount,
    tone: getChecklistTone(readyCount, totalCount),
    summary:
      remainingCount === 0
        ? "Tous les points de publication sont valides."
        : `${remainingCount} point(s) restent a traiter avant une diffusion propre.`,
    items
  };
}
