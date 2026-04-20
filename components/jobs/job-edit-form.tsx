"use client";

import { useActionState } from "react";

import { updateJobAction, type JobActionState } from "@/app/actions/job-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
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
          <input name="department" defaultValue={job.department ?? ""} placeholder="Ex. Vente, RH, Finance" />
        </label>

        <label className="field">
          <span>Lieu</span>
          <input name="location" defaultValue={job.location} placeholder="Antananarivo" />
        </label>

        <label className="field">
          <span>Type de contrat</span>
          <input name="contract_type" defaultValue={job.contract_type} placeholder="CDI" />
        </label>

        <label className="field">
          <span>Mode de travail</span>
          <input name="work_mode" defaultValue={job.work_mode} placeholder="Presentiel / Hybride / Remote" />
        </label>

        <label className="field">
          <span>Secteur</span>
          <input name="sector" defaultValue={job.sector} placeholder="Commercial, RH, Finance..." />
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
