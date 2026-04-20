"use client";

import { useActionState } from "react";

import { updateJobStatusAction, type JobActionState } from "@/app/actions/job-actions";
import type { ManagedJob } from "@/lib/types";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type JobStatusPanelProps = {
  job: ManagedJob;
};

function getActions(status: ManagedJob["status"]) {
  if (status === "draft") {
    return [
      { value: "published", label: "Publier l'offre", variant: "btn btn-primary btn-block" },
      { value: "archived", label: "Archiver", variant: "btn btn-ghost btn-block" }
    ];
  }

  if (status === "published") {
    return [
      { value: "closed", label: "Fermer l'offre", variant: "btn btn-primary btn-block" },
      { value: "draft", label: "Repasser en brouillon", variant: "btn btn-secondary btn-block" },
      { value: "archived", label: "Archiver", variant: "btn btn-ghost btn-block" }
    ];
  }

  if (status === "closed") {
    return [
      { value: "published", label: "Reouvrir et publier", variant: "btn btn-primary btn-block" },
      { value: "archived", label: "Archiver", variant: "btn btn-secondary btn-block" }
    ];
  }

  return [
    { value: "draft", label: "Restaurer en brouillon", variant: "btn btn-secondary btn-block" },
    { value: "published", label: "Republier", variant: "btn btn-primary btn-block" }
  ];
}

export function JobStatusPanel({ job }: JobStatusPanelProps) {
  const [state, formAction] = useActionState(updateJobStatusAction, initialState);
  const actions = getActions(job.status);

  return (
    <div className="dashboard-form job-status-panel">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Cycle de vie</p>
          <h2>Publier, fermer ou archiver cette offre</h2>
        </div>
        <span className="tag">{job.status}</span>
      </div>

      <div className="job-lifecycle">
        <div className="document-card">
          <strong>Etat actuel</strong>
          <div className="document-meta">
            <span>Publiee : {job.published_at ? "Oui" : "Non"}</span>
            <span>Cloture : {job.closing_at ? "Oui" : "Non"}</span>
          </div>
        </div>

        <div className="dashboard-action-stack">
          {actions.map((action) => (
            <form key={action.value} action={formAction}>
              <input type="hidden" name="job_id" value={job.id} />
              <input type="hidden" name="status" value={action.value} />
              <button className={action.variant} type="submit">
                {action.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
