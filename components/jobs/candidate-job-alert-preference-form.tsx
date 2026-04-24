"use client";

import { useActionState } from "react";

import {
  updateCandidateJobAlertsPreferenceAction,
  type ProfileActionState
} from "@/app/actions/profile-actions";
import { SubmitButton } from "@/components/jobs/submit-button";

const initialState: ProfileActionState = {
  status: "idle",
  message: ""
};

type CandidateJobAlertPreferenceFormProps = {
  enabled: boolean;
};

export function CandidateJobAlertPreferenceForm({
  enabled
}: CandidateJobAlertPreferenceFormProps) {
  const [state, formAction] = useActionState(
    updateCandidateJobAlertsPreferenceAction,
    initialState
  );

  return (
    <form action={formAction} className="candidate-alert-preference-form">
      <label className="checkbox-field">
        <input type="checkbox" name="job_alerts_enabled" defaultChecked={enabled} />
        <span>Activer les alertes d'offres compatibles</span>
      </label>
      <SubmitButton
        className="btn btn-secondary btn-block"
        idleLabel="Enregistrer ce reglage"
        pendingLabel="Mise a jour..."
      />
      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
