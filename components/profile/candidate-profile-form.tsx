"use client";

import { useActionState } from "react";

import {
  updateCandidateProfileAction,
  type ProfileActionState
} from "@/app/actions/profile-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import type { CandidateProfileData } from "@/lib/types";

const initialState: ProfileActionState = {
  status: "idle",
  message: ""
};

type CandidateProfileFormProps = {
  profile: CandidateProfileData;
};

export function CandidateProfileForm({ profile }: CandidateProfileFormProps) {
  const [state, formAction] = useActionState(updateCandidateProfileAction, initialState);
  const profileInsights = getCandidateProfileInsights(profile);

  return (
    <form action={formAction} className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Profil candidat</p>
          <h2>Completer votre dossier</h2>
        </div>
        <span className="tag">{profileInsights.completion}% complet</span>
      </div>

      <div className="form-grid">
        <div className="document-card">
          <strong>{profileInsights.readinessLabel}</strong>
          <p>{profileInsights.readinessDescription}</p>
        </div>
        <div className="document-card">
          <strong>
            {profileInsights.completedCount}/{profileInsights.totalCount} rubriques completees
          </strong>
          <p>
            {profileInsights.missingItems.length > 0
              ? `${profileInsights.missingItems.length} rubrique(s) restent prioritaires dans votre dossier.`
              : "Toutes les rubriques prioritaires sont deja renseignees."}
          </p>
        </div>
      </div>

      <div className="document-card">
        <strong>Priorites recommandees</strong>
        <ul className="dashboard-mini-list dashboard-mini-list--compact">
          {profileInsights.nextActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Nom complet</span>
          <input name="full_name" defaultValue={profile.full_name} placeholder="Nom et prenom" />
        </label>

        <label className="field">
          <span>Telephone</span>
          <input name="phone" defaultValue={profile.phone} placeholder="+261..." />
        </label>

        <label className="field field--full">
          <span>Titre / headline</span>
          <input
            name="headline"
            defaultValue={profile.headline}
            placeholder="Ex. Responsable commercial, Comptable senior..."
          />
        </label>

        <label className="field">
          <span>Ville</span>
          <input name="city" defaultValue={profile.city} placeholder="Antananarivo" />
        </label>

        <label className="field">
          <span>Pays</span>
          <input name="country" defaultValue={profile.country} placeholder="Madagascar" />
        </label>

        <label className="field">
          <span>Annees d'experience</span>
          <input
            name="experience_years"
            type="number"
            min="0"
            defaultValue={profile.experience_years ?? ""}
            placeholder="5"
          />
        </label>

        <label className="field">
          <span>Poste actuel</span>
          <input
            name="current_position"
            defaultValue={profile.current_position}
            placeholder="Votre poste actuel"
          />
        </label>

        <label className="field field--full">
          <span>Poste recherche</span>
          <input
            name="desired_position"
            defaultValue={profile.desired_position}
            placeholder="Le type de poste que vous recherchez"
          />
        </label>

        <label className="field field--full">
          <span>Competences clefs</span>
          <textarea
            name="skills_text"
            rows={4}
            defaultValue={profile.skills_text}
            placeholder="Listez vos competences, outils, langues et domaines d'expertise."
          />
        </label>

        <label className="field field--full">
          <span>Presentation</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile.bio}
            placeholder="Resumez votre parcours, vos points forts et vos objectifs."
          />
        </label>

        <label className="field field--full">
          <span>Resume de CV</span>
          <textarea
            name="cv_text"
            rows={5}
            defaultValue={profile.cv_text}
            placeholder="Collez ici un resume de votre CV en attendant le parsing/televersement complet."
          />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Enregistrer mon profil"
        pendingLabel="Mise a jour..."
      />
    </form>
  );
}
