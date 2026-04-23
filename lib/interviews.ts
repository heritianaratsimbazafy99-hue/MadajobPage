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
