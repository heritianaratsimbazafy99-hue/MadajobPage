"use client";

import { useActionState } from "react";

import { type AdminActionState, updateUserAccessAction } from "@/app/actions/admin-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import type { ManagedUserDetail, OrganizationOption, Profile } from "@/lib/types";

const initialState: AdminActionState = {
  status: "idle",
  message: ""
};

type UserAccessFormProps = {
  adminProfile: Profile;
  user: ManagedUserDetail;
  organizations: OrganizationOption[];
};

export function UserAccessForm({
  adminProfile,
  user,
  organizations
}: UserAccessFormProps) {
  const [state, formAction] = useActionState(updateUserAccessAction, initialState);
  const isSelf = adminProfile.id === user.id;

  return (
    <form action={formAction} className="dashboard-form">
      <input type="hidden" name="user_id" value={user.id} />

      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Acces & permissions</p>
          <h2>Modifier le role, l'organisation et l'etat du compte</h2>
        </div>
        <span className="tag">{user.role}</span>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nom complet</span>
          <input name="full_name" defaultValue={user.full_name ?? ""} placeholder="Nom et prenom" />
        </label>

        <label className="field">
          <span>Telephone</span>
          <input name="phone" defaultValue={user.phone ?? ""} placeholder="+261..." />
        </label>

        <label className="field">
          <span>Role</span>
          <select name="role" defaultValue={user.role} disabled={isSelf}>
            <option value="candidat">Candidat</option>
            <option value="recruteur">Recruteur</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="field">
          <span>Organisation</span>
          <select name="organization_id" defaultValue={user.organization_id ?? ""}>
            <option value="">Aucune organisation</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="checkbox-field">
        <input type="checkbox" name="is_active" defaultChecked={user.is_active} disabled={isSelf} />
        <span>{isSelf ? "Votre compte admin principal reste actif par securite" : "Compte actif"}</span>
      </label>

      <p className="form-caption">
        Les changements de role et d'activation sont journalises dans l'audit interne.
      </p>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Enregistrer les droits"
        pendingLabel="Mise a jour..."
      />
    </form>
  );
}
