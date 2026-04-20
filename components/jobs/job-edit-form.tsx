"use client";

import { useActionState } from "react";

import { updateJobAction, type JobActionState } from "@/app/actions/job-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import {
  JOB_CONTRACT_TYPE_OPTIONS,
  JOB_DEPARTMENT_OPTIONS,
  JOB_LOCATION_OPTIONS,
  JOB_SECTOR_OPTIONS,
  JOB_WORK_MODE_OPTIONS
} from "@/lib/job-options";
import type { ManagedJob } from "@/lib/types";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type JobEditFormProps = {
  job: ManagedJob;
};

export function JobEditForm({ job }: JobEditFormProps) {
  const [state, formAction] = useActionState(updateJobAction, initialState);

  return (
    <form action={formAction} className="dashboard-form">
      <input type="hidden" name="job_id" value={job.id} />

      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Edition d'offre</p>
          <h2>Mettre a jour le contenu de l'annonce</h2>
        </div>
        <span className="tag">{job.status}</span>
      </div>

      <div className="form-grid">
        <label className="field field--full">
          <span>Titre du poste</span>
          <input name="title" defaultValue={job.title} required />
        </label>

        <label className="field">
          <span>Departement</span>
          <select name="department" defaultValue={job.department ?? ""}>
            <option value="">Selectionner un departement</option>
            {JOB_DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Lieu</span>
          <select name="location" defaultValue={job.location ?? ""}>
            <option value="">Selectionner un lieu</option>
            {JOB_LOCATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Type de contrat</span>
          <select name="contract_type" defaultValue={job.contract_type ?? ""}>
            <option value="">Selectionner un contrat</option>
            {JOB_CONTRACT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Mode de travail</span>
          <select name="work_mode" defaultValue={job.work_mode ?? ""}>
            <option value="">Selectionner un mode</option>
            {JOB_WORK_MODE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Secteur</span>
          <select name="sector" defaultValue={job.sector ?? ""}>
            <option value="">Selectionner un secteur</option>
            {JOB_SECTOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--full">
          <span>Resume</span>
          <textarea name="summary" rows={4} defaultValue={job.summary} required />
        </label>

        <label className="field field--full">
          <span>Responsabilites</span>
          <textarea name="responsibilities" rows={5} defaultValue={job.responsibilities ?? ""} />
        </label>

        <label className="field field--full">
          <span>Exigences</span>
          <textarea name="requirements" rows={5} defaultValue={job.requirements ?? ""} />
        </label>

        <label className="field field--full">
          <span>Avantages</span>
          <textarea name="benefits" rows={4} defaultValue={job.benefits ?? ""} />
        </label>
      </div>

      <label className="checkbox-field">
        <input type="checkbox" name="is_featured" defaultChecked={job.is_featured} />
        <span>Mettre cette offre en avant</span>
      </label>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Enregistrer les modifications"
        pendingLabel="Mise a jour..."
      />
    </form>
  );
}
