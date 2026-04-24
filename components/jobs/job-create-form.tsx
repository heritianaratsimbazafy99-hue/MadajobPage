"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createJobAction, type JobActionState } from "@/app/actions/job-actions";
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
import type { OrganizationOption } from "@/lib/types";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type JobCreateFormProps = {
  roleLabel: string;
  organizationOptions?: OrganizationOption[];
  defaultOrganizationId?: string | null;
};

export function JobCreateForm({
  roleLabel,
  organizationOptions = [],
  defaultOrganizationId = null
}: JobCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createJobAction, initialState);
  const [draftInput, setDraftInput] = useState<JobQualityInput & JobPublicPreviewInput>({});
  const activeOrganizations = organizationOptions.filter((organization) => organization.is_active);
  const defaultSelectedOrganizationId =
    defaultOrganizationId ||
    activeOrganizations.find((organization) => organization.slug === "madajob")?.id ||
    activeOrganizations[0]?.id ||
    "";

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setDraftInput({});
    }
  }, [state.status]);

  function updateDraftInput(form: HTMLFormElement) {
    const formData = new FormData(form);
    const selectedOrganizationId = String(formData.get("organization_id") ?? "");
    const selectedOrganization = activeOrganizations.find(
      (organization) => organization.id === selectedOrganizationId
    );

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
      organization_name: selectedOrganization?.name ?? (roleLabel === "Admin" ? "Madajob" : "Votre organisation"),
      is_featured: formData.get("is_featured") === "on",
      status: String(formData.get("status") ?? "draft")
    });
  }

  const qualityReport = getJobQualityReport(draftInput);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="dashboard-form job-create-form"
      onInput={(event) => updateDraftInput(event.currentTarget)}
      onChange={(event) => updateDraftInput(event.currentTarget)}
    >
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Creation d'offre</p>
          <h2>Publier une nouvelle annonce</h2>
        </div>
        <span className="tag">{roleLabel}</span>
      </div>

      <div className="form-grid">
        {activeOrganizations.length > 0 ? (
          <label className="field field--full">
            <span>Organisation de publication</span>
            <select name="organization_id" defaultValue={defaultSelectedOrganizationId} required>
              {activeOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                  {organization.kind === "internal" ? " - Madajob" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="field">
          <span>Titre du poste</span>
          <input name="title" placeholder="Ex. Responsable commercial B2B" required />
        </label>

        <label className="field">
          <span>Departement</span>
          <select name="department" defaultValue="">
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
          <select name="location" defaultValue="">
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
          <select name="contract_type" defaultValue="">
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
          <select name="work_mode" defaultValue="">
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
          <select name="sector" defaultValue="">
            <option value="">Selectionner un secteur</option>
            {JOB_SECTOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Statut</span>
          <select name="status" defaultValue="draft">
            <option value="draft">Brouillon</option>
            <option value="published">Publiee</option>
          </select>
        </label>

        <label className="field">
          <span>Date de cloture cible</span>
          <input name="closing_at" type="date" />
        </label>

        <label className="field field--full">
          <span>Resume</span>
          <textarea
            name="summary"
            rows={4}
            placeholder="Resume clair de l'offre pour le site carriere et la plateforme."
            required
          />
        </label>

        <label className="field field--full">
          <span>Responsabilites</span>
          <textarea
            name="responsibilities"
            rows={4}
            placeholder="Principales missions, perimetre, objectifs..."
          />
        </label>

        <label className="field field--full">
          <span>Exigences</span>
          <textarea
            name="requirements"
            rows={4}
            placeholder="Competences, experience, niveau attendu..."
          />
        </label>

        <label className="field field--full">
          <span>Avantages</span>
          <textarea
            name="benefits"
            rows={3}
            placeholder="Salaire, package, variable, avantages, environnement..."
          />
        </label>
      </div>

      <JobQualityPanel report={qualityReport} title="Score avant publication" />

      <JobPublicPreview job={draftInput} />

      <label className="checkbox-field">
        <input type="checkbox" name="is_featured" />
        <span>Mettre cette offre en avant sur le site carriere institutionnel</span>
      </label>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Enregistrer l'offre"
        pendingLabel="Publication en cours..."
      />
    </form>
  );
}
