"use client";

import { useActionState } from "react";

import {
  updateApplicationStatusAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";

const initialState: ApplicationActionState = {
  status: "idle",
  message: ""
};

const statusOptions = [
  { value: "submitted", label: "Soumise" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Entretien" },
  { value: "shortlist", label: "Shortlist" },
  { value: "hired", label: "Recrute" },
  { value: "rejected", label: "Refuse" }
];

type ApplicationStatusFormProps = {
  applicationId: string;
  currentStatus: string;
};

export function ApplicationStatusForm({
  applicationId,
  currentStatus
}: ApplicationStatusFormProps) {
  const [state, formAction] = useActionState(updateApplicationStatusAction, initialState);

  return (
    <form action={formAction} className="status-form">
      <input type="hidden" name="application_id" value={applicationId} />

      <label className="field">
        <span>Statut</span>
        <select name="status" defaultValue={currentStatus}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-secondary btn-block"
        idleLabel="Mettre a jour"
        pendingLabel="Mise a jour..."
      />
    </form>
  );
}
