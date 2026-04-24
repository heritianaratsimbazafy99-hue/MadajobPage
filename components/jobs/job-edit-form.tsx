"use client";

import { useActionState, useState } from "react";

import { updateJobAction, type JobActionState } from "@/app/actions/job-actions";
import { JobPublicPreview, type JobPublicPreviewInput } from "@/components/jobs/job-public-preview";
import { JobQualityPanel } from "@/components/jobs/job-quality-panel";
import { SubmitButton } from "@/components/jobs/submit-button";
import {
  JOB_CONTRACT_TYPE_OPTIONS,
  JOB_DEPARTMENT_OPTIONS,
  JOB_LOCATION_OPTIONS,
  JOB_SECTOR_OPTIONS,
  JOB_WORK_MODE_OPTIONS
} from "@/lib/job-options";
import { getJobQualityReport, type JobQualityInput } from "@/lib/job-quality";
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
  const [draftInput, setDraftInput] = useState<JobQualityInput & JobPublicPreviewInput>({
    title: job.title,
    department: job.department ?? "",
    location: job.location ?? "",
    contract_type: job.contract_type ?? "",
    work_mode: job.work_mode ?? "",
    sector: job.sector ?? "",
    summary: job.summary,
    responsibilities: job.responsibilities ?? "",
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
    closing_at: job.closing_at,
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    salary_currency: job.salary_currency ?? "MGA",
    salary_period: job.salary_period ?? "month",
    salary_is_visible: job.salary_is_visible,
    organization_name: job.organization_name ?? "Madajob",
    is_featured: job.is_featured,
    status: job.status
  });
  const qualityReport = getJobQualityReport(draftInput);

  function updateDraftInput(form: HTMLFormElement) {
    const formData = new FormData(form);

    setDraftInput({
      title: String(formData.get("title") ?? ""),
      department: String(formData.get("department") ?? ""),
      location: String(formData.get("location") ?? ""),
      contract_type: String(formData.get("contract_type") ?? ""),
      work_mode: String(formData.get("work_mode") ?? ""),
      sector: String(formData.get("sector") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      responsibilities: String(formData.get("responsibilities") ?? ""),
      requirements: String(formData.get("requirements") ?? ""),
      benefits: String(formData.get("benefits") ?? ""),
      closing_at: String(formData.get("closing_at") ?? ""),
      salary_min: Number(formData.get("salary_min") || 0) || null,
      salary_max: Number(formData.get("salary_max") || 0) || null,
      salary_currency: String(formData.get("salary_currency") ?? "MGA"),
      salary_period: String(formData.get("salary_period") ?? "month"),
      salary_is_visible: formData.get("salary_is_visible") === "on",
      organization_name: job.organization_name ?? "Madajob",
      is_featured: formData.get("is_featured") === "on",
      status: job.status
    });
  }

  return (
    <form
      action={formAction}
      className="dashboard-form"
      onInput={(event) => updateDraftInput(event.currentTarget)}
      onChange={(event) => updateDraftInput(event.currentTarget)}
    >
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

        <label className="field">
          <span>Date de cloture cible</span>
          <input name="closing_at" type="date" defaultValue={job.closing_at?.slice(0, 10) ?? ""} />
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

        <label className="field">
          <span>Salaire minimum</span>
          <input name="salary_min" type="number" min="0" step="1000" defaultValue={job.salary_min ?? ""} />
        </label>

        <label className="field">
          <span>Salaire maximum</span>
          <input name="salary_max" type="number" min="0" step="1000" defaultValue={job.salary_max ?? ""} />
        </label>

        <label className="field">
          <span>Devise</span>
          <select name="salary_currency" defaultValue={job.salary_currency ?? "MGA"}>
            <option value="MGA">MGA</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>

        <label className="field">
          <span>Periode</span>
          <select name="salary_period" defaultValue={job.salary_period ?? "month"}>
            <option value="month">Mensuel</option>
            <option value="year">Annuel</option>
            <option value="day">Journalier</option>
            <option value="hour">Horaire</option>
          </select>
        </label>
      </div>

      <label className="checkbox-field">
        <input type="checkbox" name="salary_is_visible" defaultChecked={job.salary_is_visible} />
        <span>Afficher cette remuneration sur la page publique</span>
      </label>

      <JobQualityPanel report={qualityReport} title="Score avant publication" />

      <JobPublicPreview job={draftInput} />

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
