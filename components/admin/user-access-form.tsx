"use client";

import { useActionState, useState } from "react";

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

function getRoleScope(role: ManagedUserDetail["role"]) {
  if (role === "admin") {
    return {
      title: "Portee globale",
      description:
        "Ce role ouvre la supervision complete de la plateforme. Gardez-le reserve aux personnes qui doivent piloter les modules admin."
    };
  }

  if (role === "recruteur") {
    return {
      title: "Portee organisationnelle",
      description:
        "Le compte agit au niveau d'une organisation. Le rattachement est obligatoire pour publier, suivre et arbitrer correctement."
    };
  }

  return {
    title: "Portee candidat",
    description:
      "Le compte reste limite a l'espace candidat. Aucun rattachement organisationnel n'est conserve sur ce role."
  };
}

export function UserAccessForm({
  adminProfile,
  user,
  organizations
}: UserAccessFormProps) {
  const [state, formAction] = useActionState(updateUserAccessAction, initialState);
  const [selectedRole, setSelectedRole] = useState<ManagedUserDetail["role"]>(user.role);
  const isSelf = adminProfile.id === user.id;
  const roleScope = getRoleScope(selectedRole);
  const organizationDisabled = selectedRole === "candidat";

  return (
    <form action={formAction} className="dashboard-form">
      <input type="hidden" name="user_id" value={user.id} />

      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Acces & permissions</p>
          <h2>Modifier le role, l'organisation et l'etat du compte</h2>
        </div>
        <span className="tag">{selectedRole}</span>
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
          <select
            name="role"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as ManagedUserDetail["role"])}
            disabled={isSelf}
          >
            <option value="candidat">Candidat</option>
            <option value="recruteur">Recruteur</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="field">
          <span>Organisation</span>
          <select
            name="organization_id"
            defaultValue={user.organization_id ?? ""}
            disabled={organizationDisabled}
            required={selectedRole === "recruteur"}
          >
            <option value="">Aucune organisation</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="document-card">
        <strong>{roleScope.title}</strong>
        <p>{roleScope.description}</p>
      </div>

      {selectedRole === "recruteur" ? (
        <p className="form-caption">
          Un recruteur doit toujours etre rattache a une organisation active avant activation.
        </p>
      ) : null}

      {selectedRole === "candidat" ? (
        <p className="form-caption">
          En role candidat, le rattachement organisationnel est automatiquement ignore.
        </p>
      ) : null}

      <label className="checkbox-field">
        <input type="checkbox" name="is_active" defaultChecked={user.is_active} disabled={isSelf} />
        <span>
          {isSelf
            ? "Votre compte admin principal reste actif par securite"
            : "Compte actif"}
        </span>
      </label>

      <p className="form-caption">
        Les changements de role, de rattachement et d'activation sont journalises dans l'audit interne.
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
