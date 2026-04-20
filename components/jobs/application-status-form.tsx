"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateApplicationStatusAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { applicationStatusOptions } from "@/lib/application-status";

const initialState: ApplicationActionState = {
  status: "idle",
  message: ""
};

type ApplicationStatusFormProps = {
  applicationId: string;
  currentStatus: string;
};

export function ApplicationStatusForm({
  applicationId,
  currentStatus
}: ApplicationStatusFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateApplicationStatusAction, initialState);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition, state.status]);

  return (
    <form action={formAction} className="status-form">
      <input type="hidden" name="application_id" value={applicationId} />

      <label className="field">
        <span>Statut</span>
        <select
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {applicationStatusOptions.map((option) => (
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
