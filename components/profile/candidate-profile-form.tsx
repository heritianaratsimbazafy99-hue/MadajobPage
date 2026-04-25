"use client";

import { useActionState } from "react";

import {
  updateCandidateProfileAction,
  type ProfileActionState
} from "@/app/actions/profile-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import {
  CANDIDATE_EXPERIENCE_LEVEL_OPTIONS,
  JOB_CONTRACT_TYPE_OPTIONS,
  JOB_LOCATION_OPTIONS,
  JOB_SECTOR_OPTIONS,
  JOB_WORK_MODE_OPTIONS
} from "@/lib/job-options";
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
    <form action={formAction} className="dashboard-form candidate-profile-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Profil candidat</p>
          <h2>Completer votre dossier par etapes</h2>
        </div>
        <span className="tag">{profileInsights.completion}% complet</span>
      </div>

      <div className="candidate-profile-form__summary">
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

      <div className="document-card candidate-profile-form__priority">
        <strong>Priorites recommandees</strong>
        <ul className="dashboard-mini-list dashboard-mini-list--compact">
          {profileInsights.nextActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="candidate-profile-form__sections">
        <section className="candidate-profile-section">
          <div className="candidate-profile-section__head">
            <span>01</span>
            <div>
              <h3>Identite et contact</h3>
              <p>Les informations visibles et utiles au premier contact recruteur.</p>
            </div>
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
          </div>
        </section>

        <section className="candidate-profile-section">
          <div className="candidate-profile-section__head">
            <span>02</span>
            <div>
              <h3>Positionnement professionnel</h3>
              <p>Ce qui aide Madajob a comprendre votre trajectoire et vos forces.</p>
            </div>
          </div>

          <div className="form-grid">
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
          </div>
        </section>

        <section className="candidate-profile-section" id="candidate-search-preferences">
          <div className="candidate-profile-section__head">
            <span>03</span>
            <div>
              <h3>Preferences de recherche</h3>
              <p>Ces criteres priorisent les offres et alertes sans masquer les autres opportunites.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Contrat souhaite</span>
              <select name="desired_contract_type" defaultValue={profile.desired_contract_type}>
                <option value="">Tous les contrats</option>
                {JOB_CONTRACT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Mode de travail souhaite</span>
              <select name="desired_work_mode" defaultValue={profile.desired_work_mode}>
                <option value="">Tous les modes</option>
                {JOB_WORK_MODE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Salaire minimum mensuel</span>
              <input
                name="desired_salary_min"
                type="number"
                min="0"
                step="1000"
                defaultValue={profile.desired_salary_min ?? ""}
                placeholder="Ex. 1500000"
              />
            </label>

            <label className="field">
              <span>Devise</span>
              <select name="desired_salary_currency" defaultValue={profile.desired_salary_currency || "MGA"}>
                <option value="MGA">MGA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <label className="field field--full">
              <span>Secteurs cibles</span>
              <input
                name="desired_sectors"
                defaultValue={profile.desired_sectors.join(", ")}
                list="candidate-sector-options"
                placeholder="Ex. Commercial, IT & Data"
              />
              <small>Separez plusieurs secteurs par des virgules. Maximum 8.</small>
              <datalist id="candidate-sector-options">
                {JOB_SECTOR_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Lieux souhaites</span>
              <input
                name="desired_locations"
                defaultValue={profile.desired_locations.join(", ")}
                list="candidate-location-options"
                placeholder="Ex. Antananarivo, Remote Madagascar"
              />
              <small>Separez plusieurs lieux par des virgules. Maximum 8.</small>
              <datalist id="candidate-location-options">
                {JOB_LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Niveau d'experience cible</span>
              <select
                name="desired_experience_level"
                defaultValue={profile.desired_experience_level}
              >
                <option value="">Tous niveaux</option>
                {CANDIDATE_EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox-field field--full candidate-profile-alert-toggle">
              <input
                type="checkbox"
                name="job_alerts_enabled"
                defaultChecked={profile.job_alerts_enabled}
              />
              <span>Recevoir les alertes lorsqu'une nouvelle offre correspond a mes preferences</span>
            </label>
          </div>
        </section>

        <section className="candidate-profile-section">
          <div className="candidate-profile-section__head">
            <span>04</span>
            <div>
              <h3>Resume recruteur</h3>
              <p>Une presentation courte et exploitable pour les dossiers et le matching.</p>
            </div>
          </div>

          <div className="form-grid">
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
        </section>
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
