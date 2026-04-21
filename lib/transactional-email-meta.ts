export function getTransactionalEmailTemplateMeta(templateKey: string) {
  switch (templateKey) {
    case "candidate_application_confirmation":
      return {
        label: "Confirmation candidature",
        description: "Email de confirmation envoye apres depot d'une candidature."
      };
    case "candidate_application_status_update":
      return {
        label: "Mise a jour candidature",
        description: "Email prevu lors d'un changement de statut candidat."
      };
    case "account_invited":
      return {
        label: "Invitation compte",
        description: "Email d'invitation declenche via Supabase Auth."
      };
    default:
      return {
        label: templateKey.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
        description: "Email transactionnel Madajob."
      };
  }
}

export function getTransactionalEmailStatusMeta(status: string) {
  switch (status) {
    case "queued":
      return {
        label: "En file",
        description: "Pret pour un futur envoi par provider.",
        tone: "info"
      };
    case "processing":
      return {
        label: "En cours",
        description: "Envoi actuellement en traitement.",
        tone: "info"
      };
    case "sent":
      return {
        label: "Envoye",
        description: "Email confirme comme envoye par le provider.",
        tone: "success"
      };
    case "failed":
      return {
        label: "Echec",
        description: "L'envoi a rencontre une erreur et doit etre repris.",
        tone: "danger"
      };
    case "skipped":
      return {
        label: "Ignore",
        description: "Aucun envoi externe n'a ete declenche pour cet element.",
        tone: "muted"
      };
    default:
      return {
        label: status.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
        description: "Statut email inconnu.",
        tone: "muted"
      };
  }
}
