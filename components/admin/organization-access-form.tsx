"use client";

import { useActionState } from "react";

import { type AdminActionState, updateOrganizationAction } from "@/app/actions/admin-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import type { ManagedOrganizationDetail } from "@/lib/types";

const initialState: AdminActionState = {
  status: "idle",
  message: ""
};

type OrganizationAccessFormProps = {
  organization: ManagedOrganizationDetail;
};

export function OrganizationAccessForm({
  organization
}: OrganizationAccessFormProps) {
  const [state, formAction] = useActionState(updateOrganizationAction, initialState);

  return (
    <form action={formAction} className="dashboard-form">
      <input type="hidden" name="organization_id" value={organization.id} />

      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Parametres organisation</p>
          <h2>Mettre a jour les metadonnees et l'etat de l'entite</h2>
        </div>
        <span className="tag">{organization.kind}</span>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nom</span>
          <input name="name" defaultValue={organization.name} placeholder="Nom organisation" />
        </label>

        <label className="field">
          <span>Slug</span>
          <input name="slug" defaultValue={organization.slug} placeholder="organisation-slug" />
        </label>

        <label className="field">
          <span>Type</span>
          <input name="kind" defaultValue={organization.kind} placeholder="client, internal..." />
        </label>
      </div>

      <label className="checkbox-field">
        <input type="checkbox" name="is_active" defaultChecked={organization.is_active} />
        <span>Organisation active</span>
      </label>

      <p className="form-caption">
        Les modifications sont journalisees dans l&apos;audit interne et revalident les vues admin associees.
      </p>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Enregistrer l'organisation"
        pendingLabel="Mise a jour..."
      />
    </form>
  );
}
