import { getApplicationStatusMeta } from "@/lib/application-status";
import type { TransactionalEmail } from "@/lib/types";

type RenderedTransactionalEmail = {
  heading: string;
  intro: string;
  body: string[];
  ctaLabel: string | null;
  ctaHref: string | null;
  textBody: string;
};

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawSiteUrl) {
    return "http://localhost:3000";
  }

  return rawSiteUrl.replace(/\/$/, "");
}

function toAbsoluteUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function readStringValue(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

export function renderTransactionalEmail(email: TransactionalEmail): RenderedTransactionalEmail {
  const recipientFirstName =
    email.recipient_name?.trim().split(/\s+/)[0] ?? "Bonjour";
  const absoluteLink = toAbsoluteUrl(email.link_href);
  const metadata = email.metadata;

  switch (email.template_key) {
    case "candidate_application_confirmation": {
      const jobTitle = readStringValue(metadata, "job_title") ?? "votre offre";
      const body = [
        "Votre dossier est maintenant visible dans votre espace candidat Madajob.",
        "Vous pourrez y suivre les prochaines evolutions sans repasser par la vitrine publique."
      ];

      return {
        heading: `Candidature recue pour ${jobTitle}`,
        intro: `${recipientFirstName}, votre candidature pour ${jobTitle} a bien ete enregistree.`,
        body,
        ctaLabel: absoluteLink ? "Suivre ma candidature" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          `Votre candidature pour ${jobTitle} a bien ete enregistree sur Madajob.`,
          ...body,
          absoluteLink ? "" : null,
          absoluteLink ? `Suivre ma candidature : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }

    case "candidate_application_status_update": {
      const jobTitle = readStringValue(metadata, "job_title") ?? "votre offre";
      const status = readStringValue(metadata, "status") ?? "submitted";
      const statusMeta = getApplicationStatusMeta(status);
      const body = [
        `Le statut actuel de votre dossier est maintenant : ${statusMeta.label}.`,
        statusMeta.candidateHint
      ];

      return {
        heading: `Mise a jour de votre candidature pour ${jobTitle}`,
        intro: `${recipientFirstName}, votre dossier a evolue sur Madajob.`,
        body,
        ctaLabel: absoluteLink ? "Ouvrir mon suivi candidat" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          `Votre candidature pour ${jobTitle} est maintenant au statut ${statusMeta.label}.`,
          statusMeta.candidateHint,
          absoluteLink ? "" : null,
          absoluteLink ? `Voir le suivi : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }

    case "candidate_interview_scheduled": {
      const jobTitle = readStringValue(metadata, "job_title") ?? "votre offre";
      const interviewStartsAt = readStringValue(metadata, "interview_starts_at");
      const dateLabel = interviewStartsAt
        ? new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date(interviewStartsAt))
        : "a confirmer";
      const body = [
        `Votre entretien est actuellement planifie pour le ${dateLabel}.`,
        "Retrouvez le detail du dossier et les prochaines etapes dans votre espace candidat."
      ];

      return {
        heading: `Entretien planifie pour ${jobTitle}`,
        intro: `${recipientFirstName}, une nouvelle etape vient d'etre planifiee sur Madajob.`,
        body,
        ctaLabel: absoluteLink ? "Voir mon dossier" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          `Votre entretien pour ${jobTitle} est planifie pour le ${dateLabel}.`,
          "Retrouvez le detail dans votre espace candidat Madajob.",
          absoluteLink ? "" : null,
          absoluteLink ? `Voir mon dossier : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }

    case "candidate_interview_cancelled": {
      const jobTitle = readStringValue(metadata, "job_title") ?? "votre offre";
      const body = [
        "L'entretien planifie sur ce dossier a ete annule.",
        "Consultez votre espace candidat pour suivre la suite du processus et les prochaines informations."
      ];

      return {
        heading: `Entretien annule pour ${jobTitle}`,
        intro: `${recipientFirstName}, une mise a jour a ete effectuee sur votre planning de recrutement.`,
        body,
        ctaLabel: absoluteLink ? "Ouvrir mon suivi" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          `L'entretien planifie pour ${jobTitle} a ete annule.`,
          "Consultez votre espace candidat pour suivre la suite du processus.",
          absoluteLink ? "" : null,
          absoluteLink ? `Ouvrir mon suivi : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }

    case "account_invited": {
      const invitedRole = readStringValue(metadata, "invited_role") ?? "utilisateur";
      const body = [
        "Un acces a ete prepare pour vous sur la plateforme Madajob.",
        `Le role associe a cet acces est : ${invitedRole}.`
      ];

      return {
        heading: "Votre acces Madajob est pret",
        intro: `${recipientFirstName}, un compte a ete prepare pour vous.`,
        body,
        ctaLabel: absoluteLink ? "Acceder a Madajob" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          "Un acces a ete prepare pour vous sur la plateforme Madajob.",
          `Role attribue : ${invitedRole}.`,
          absoluteLink ? "" : null,
          absoluteLink ? `Acceder a Madajob : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }

    default: {
      return {
        heading: email.subject,
        intro: `${recipientFirstName}, ${email.preview_text}`,
        body: ["Cet email transactionnel est journalise dans la plateforme Madajob."],
        ctaLabel: absoluteLink ? "Ouvrir le contexte" : null,
        ctaHref: absoluteLink,
        textBody: [
          `Bonjour ${recipientFirstName},`,
          "",
          email.preview_text,
          absoluteLink ? "" : null,
          absoluteLink ? `Ouvrir le contexte : ${absoluteLink}` : null
        ]
          .filter(Boolean)
          .join("\n")
      };
    }
  }
}
