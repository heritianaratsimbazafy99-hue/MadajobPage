"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  inviteUserAction,
  type UserInvitationState
} from "@/app/actions/user-invitations";
import { SubmitButton } from "@/components/jobs/submit-button";
import type { OrganizationOption } from "@/lib/types";

const initialState: UserInvitationState = {
  status: "idle",
  message: ""
};

type InviteUserFormProps = {
  organizations: OrganizationOption[];
};

export function InviteUserForm({ organizations }: InviteUserFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(inviteUserAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Invitation interne</p>
          <h2>Creer un acces recruteur, admin ou candidat depuis la plateforme</h2>
        </div>
        <span className="tag">Admin</span>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nom complet</span>
          <input name="full_name" placeholder="Nom et prenom" />
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" placeholder="nom@entreprise.com" required />
        </label>

        <label className="field">
          <span>Role</span>
          <select name="role" defaultValue="recruteur">
            <option value="recruteur">Recruteur</option>
            <option value="admin">Admin</option>
            <option value="candidat">Candidat</option>
          </select>
        </label>

        <label className="field">
          <span>Organisation</span>
          <select name="organization_id" defaultValue="">
            <option value="">Aucune organisation</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="form-caption">
        Les invitations internes envoient un email Supabase et preconfigurent le role du compte.
      </p>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Envoyer l'invitation"
        pendingLabel="Envoi en cours..."
      />
    </form>
  );
}
