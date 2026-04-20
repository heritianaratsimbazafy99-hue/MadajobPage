"use client";

import { useActionState, useEffect, useRef } from "react";

import { createJobAction, type JobActionState } from "@/app/actions/job-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import {
  JOB_CONTRACT_TYPE_OPTIONS,
  JOB_DEPARTMENT_OPTIONS,
  JOB_LOCATION_OPTIONS,
  JOB_SECTOR_OPTIONS,
  JOB_WORK_MODE_OPTIONS
} from "@/lib/job-options";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type JobCreateFormProps = {
  roleLabel: string;
};

export function JobCreateForm({ roleLabel }: JobCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createJobAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Creation d'offre</p>
          <h2>Publier une nouvelle annonce</h2>
        </div>
        <span className="tag">{roleLabel}</span>
      </div>

      <div className="form-grid">
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
            placeholder="Elements de contexte, benefices, environnement..."
          />
        </label>
      </div>

      <label className="checkbox-field">
        <input type="checkbox" name="is_featured" />
        <span>Mettre cette offre en avant sur le site carriere</span>
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
