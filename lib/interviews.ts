export const interviewStatusOptions = [
  {
    value: "scheduled",
    label: "Planifie",
    tone: "info"
  },
  {
    value: "completed",
    label: "Termine",
    tone: "success"
  },
  {
    value: "cancelled",
    label: "Annule",
    tone: "danger"
  }
] as const;

export const interviewFormatOptions = [
  {
    value: "video",
    label: "Visio"
  },
  {
    value: "onsite",
    label: "Presentiel"
  },
  {
    value: "phone",
    label: "Telephone"
  },
  {
    value: "other",
    label: "Autre"
  }
] as const;

export const interviewRecommendationOptions = [
  {
    value: "strong_yes",
    label: "Go fort",
    tone: "success"
  },
  {
    value: "yes",
    label: "Favorable",
    tone: "success"
  },
  {
    value: "mixed",
    label: "Reserve",
    tone: "info"
  },
  {
    value: "no",
    label: "Defavorable",
    tone: "danger"
  }
] as const;

export const interviewProposedDecisionOptions = [
  {
    value: "advance",
    label: "Passer a l'etape suivante",
    tone: "success"
  },
  {
    value: "hold",
    label: "Mettre en attente",
    tone: "info"
  },
  {
    value: "reject",
    label: "Refuser le dossier",
    tone: "danger"
  },
  {
    value: "hire",
    label: "Preparer une embauche",
    tone: "success"
  }
] as const;

export const interviewNextActionOptions = [
  {
    value: "schedule_next_interview",
    label: "Planifier un prochain entretien"
  },
  {
    value: "team_debrief",
    label: "Debrief interne"
  },
  {
    value: "collect_references",
    label: "Verifier les references"
  },
  {
    value: "send_offer",
    label: "Preparer une proposition"
  },
  {
    value: "reject_candidate",
    label: "Preparer un refus"
  },
  {
    value: "keep_warm",
    label: "Garder le dossier au chaud"
  }
] as const;

export function getInterviewStatusMeta(status: string) {
  return (
    interviewStatusOptions.find((option) => option.value === status) ?? {
      value: status,
      label: status || "Statut inconnu",
      tone: "muted"
    }
  );
}

export function getInterviewFormatLabel(format: string) {
  return interviewFormatOptions.find((option) => option.value === format)?.label ?? format ?? "Format libre";
}

export function getInterviewRecommendationMeta(recommendation: string) {
  return (
    interviewRecommendationOptions.find((option) => option.value === recommendation) ?? {
      value: recommendation,
      label: recommendation || "Recommandation inconnue",
      tone: "muted"
    }
  );
}

export function getInterviewProposedDecisionMeta(decision: string) {
  return (
    interviewProposedDecisionOptions.find((option) => option.value === decision) ?? {
      value: decision,
      label: decision || "Decision inconnue",
      tone: "muted"
    }
  );
}

export function getInterviewNextActionLabel(nextAction: string) {
  return interviewNextActionOptions.find((option) => option.value === nextAction)?.label ?? nextAction ?? "Action libre";
}
