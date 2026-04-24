const notificationKindMeta = new Map<
  string,
  { label: string; description: string }
>([
  [
    "application_submitted",
    {
      label: "Candidature envoyee",
      description: "Confirmation de depot d'une candidature depuis la plateforme."
    }
  ],
  [
    "candidate_job_match",
    {
      label: "Nouvelle offre compatible",
      description: "Une offre publiee correspond aux preferences et au matching candidat."
    }
  ],
  [
    "application_status_updated",
    {
      label: "Statut mis a jour",
      description: "Evolution d'un dossier deja envoye."
    }
  ],
  [
    "new_application_received",
    {
      label: "Nouvelle candidature",
      description: "Un nouveau dossier candidat est arrive sur une offre suivie."
    }
  ],
  [
    "application_interview_scheduled",
    {
      label: "Entretien planifie",
      description: "Un entretien a ete planifie sur une candidature."
    }
  ],
  [
    "application_interview_cancelled",
    {
      label: "Entretien annule",
      description: "Un entretien a ete annule sur une candidature."
    }
  ],
  [
    "account_invited",
    {
      label: "Compte invite",
      description: "Un acces Madajob a ete prepare pour cet utilisateur."
    }
  ],
  [
    "user_invited",
    {
      label: "Invitation envoyee",
      description: "Confirmation qu'une invitation interne a ete declenchee."
    }
  ]
]);

export function getNotificationKindMeta(kind: string) {
  return (
    notificationKindMeta.get(kind) ?? {
      label: kind.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      description: "Notification plateforme Madajob."
    }
  );
}
