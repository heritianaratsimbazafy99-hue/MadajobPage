"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  saveInterviewFeedbackAction,
  scheduleInterviewAction,
  updateInterviewStatusAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewFormatLabel,
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getInterviewStatusMeta,
  interviewFormatOptions,
  interviewNextActionOptions,
  interviewProposedDecisionOptions,
  interviewRecommendationOptions
} from "@/lib/interviews";
import type { ApplicationInterview } from "@/lib/types";

const initialState: ApplicationActionState = {
  status: "idle",
  message: ""
};

type ApplicationInterviewsProps = {
  applicationId: string;
  interviews: ApplicationInterview[];
};

type InterviewFeedbackEditorProps = {
  applicationId: string;
  interview: ApplicationInterview;
};

function InterviewFeedbackEditor({
  applicationId,
  interview
}: InterviewFeedbackEditorProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveInterviewFeedbackAction, initialState);
  const [, startTransition] = useTransition();
  const feedback = interview.feedback;
  const recommendationMeta = feedback
    ? getInterviewRecommendationMeta(feedback.recommendation)
    : null;
  const proposedDecisionMeta = feedback
    ? getInterviewProposedDecisionMeta(feedback.proposed_decision)
    : null;

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition, state.status]);

  return (
    <div className="interview-feedback-editor">
      {feedback ? (
        <div className="interview-feedback-editor__summary">
          <div className="dashboard-card__top">
            <div>
              <strong>{proposedDecisionMeta?.label}</strong>
              <p>{getInterviewNextActionLabel(feedback.next_action)}</p>
            </div>
            <span className={`tag tag--${recommendationMeta?.tone ?? "muted"}`}>
              {recommendationMeta?.label ?? "Feedback"}
            </span>
          </div>

          <p>{feedback.summary}</p>

          <div className="form-grid">
            <div className="document-card">
              <strong>Points forts</strong>
              <p>{feedback.strengths}</p>
            </div>
            <div className="document-card">
              <strong>Points de vigilance</strong>
              <p>{feedback.concerns}</p>
            </div>
          </div>

          <div className="document-meta">
            <span>{feedback.author_name}</span>
            {feedback.author_email ? <span>{feedback.author_email}</span> : null}
            <span>Maj {formatDateTimeDisplay(feedback.updated_at)}</span>
          </div>
        </div>
      ) : interview.status === "completed" ? (
        <p className="form-caption">Compte-rendu encore manquant pour cet entretien termine.</p>
      ) : (
        <p className="form-caption">
          Le compte-rendu structure pourra etre saisi ici des que l'entretien aura eu lieu.
        </p>
      )}

      {interview.status !== "cancelled" ? (
        <details
          className="interview-feedback-editor__details"
          open={interview.status === "completed" && !feedback}
        >
          <summary>{feedback ? "Modifier le compte-rendu" : "Ajouter le compte-rendu"}</summary>

          <form action={formAction} className="status-form">
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="interview_id" value={interview.id} />

            <div className="form-grid">
              <label className="field field--full">
                <span>Synthese entretien</span>
                <textarea
                  name="summary"
                  rows={3}
                  defaultValue={feedback?.summary ?? ""}
                  placeholder="Resume factuel, niveau de fit, signaux principaux..."
                  required
                />
              </label>

              <label className="field field--full">
                <span>Points forts</span>
                <textarea
                  name="strengths"
                  rows={3}
                  defaultValue={feedback?.strengths ?? ""}
                  placeholder="Ex. communication, maitrise metier, posture manageriale..."
                  required
                />
              </label>

              <label className="field field--full">
                <span>Points de vigilance</span>
                <textarea
                  name="concerns"
                  rows={3}
                  defaultValue={feedback?.concerns ?? ""}
                  placeholder="Ex. manque de profondeur technique, disponibilite, zones a creuser..."
                  required
                />
              </label>

              <label className="field">
                <span>Recommandation</span>
                <select
                  name="recommendation"
                  defaultValue={feedback?.recommendation ?? "yes"}
                  required
                >
                  {interviewRecommendationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Decision proposee</span>
                <select
                  name="proposed_decision"
                  defaultValue={feedback?.proposed_decision ?? "advance"}
                  required
                >
                  {interviewProposedDecisionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--full">
                <span>Prochaine action</span>
                <select
                  name="next_action"
                  defaultValue={feedback?.next_action ?? "team_debrief"}
                  required
                >
                  {interviewNextActionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {interview.status === "scheduled" ? (
              <label className="checkbox-field">
                <input type="checkbox" name="mark_completed" value="true" defaultChecked />
                <span>Marquer aussi cet entretien comme termine</span>
              </label>
            ) : null}

            {state.message ? (
              <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
                {state.message}
              </p>
            ) : null}

            <SubmitButton
              className="btn btn-secondary btn-block"
              idleLabel={feedback ? "Mettre a jour le compte-rendu" : "Enregistrer le compte-rendu"}
              pendingLabel="Enregistrement..."
            />
          </form>
        </details>
      ) : null}
    </div>
  );
}

export function ApplicationInterviews({
  applicationId,
  interviews
}: ApplicationInterviewsProps) {
  const router = useRouter();
  const [timezone, setTimezone] = useState("Indian/Antananarivo");
  const [scheduleState, scheduleAction] = useActionState(scheduleInterviewAction, initialState);
  const [statusState, statusAction] = useActionState(updateInterviewStatusAction, initialState);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolvedTimezone) {
      setTimezone(resolvedTimezone);
    }
  }, []);

  useEffect(() => {
    if (scheduleState.status === "success" || statusState.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, scheduleState.status, startTransition, statusState.status]);

  const scheduledCount = interviews.filter((interview) => interview.status === "scheduled").length;
  const completedCount = interviews.filter((interview) => interview.status === "completed").length;
  const feedbackCount = interviews.filter((interview) => Boolean(interview.feedback)).length;

  return (
    <div className="application-interviews">
      <div className="application-interviews__stats">
        <article className="document-card">
          <strong>{interviews.length}</strong>
          <p>entretien(s) journalise(s) sur ce dossier</p>
        </article>
        <article className="document-card">
          <strong>{scheduledCount}</strong>
          <p>entretien(s) a venir ou encore ouverts</p>
        </article>
        <article className="document-card">
          <strong>{completedCount}</strong>
          <p>entretien(s) termines</p>
        </article>
        <article className="document-card">
          <strong>{feedbackCount}</strong>
          <p>compte-rendu(s) saisis</p>
        </article>
      </div>

      <div className="application-interviews__list">
        {interviews.length > 0 ? (
          interviews.map((interview) => {
            const statusMeta = getInterviewStatusMeta(interview.status);

            return (
              <article
                key={interview.id}
                id={`interview-${interview.id}`}
                className="document-card interview-card"
              >
                <div className="dashboard-card__top">
                  <div>
                    <strong>{getInterviewFormatLabel(interview.format)}</strong>
                    <p>{formatDateTimeDisplay(interview.starts_at)}</p>
                  </div>
                  <span className={`tag tag--${statusMeta.tone}`}>{statusMeta.label}</span>
                </div>

                <div className="document-meta">
                  <span>{interview.interviewer_name}</span>
                  {interview.interviewer_email ? <span>{interview.interviewer_email}</span> : null}
                  <span>{interview.timezone}</span>
                </div>

                {interview.location ? <p>Lieu : {interview.location}</p> : null}
                {interview.notes ? <p>{interview.notes}</p> : null}

                <div className="notification-card__actions">
                  {interview.meeting_url ? (
                    <Link href={interview.meeting_url} target="_blank" rel="noreferrer">
                      Ouvrir le lien d'entretien
                    </Link>
                  ) : null}
                </div>

                <InterviewFeedbackEditor applicationId={applicationId} interview={interview} />

                {interview.status === "scheduled" ? (
                  <div className="application-interviews__actions">
                    <form action={statusAction}>
                      <input type="hidden" name="interview_id" value={interview.id} />
                      <input type="hidden" name="status" value="completed" />
                      <SubmitButton
                        className="btn btn-secondary"
                        idleLabel="Marquer termine"
                        pendingLabel="Mise a jour..."
                      />
                    </form>
                    <form action={statusAction}>
                      <input type="hidden" name="interview_id" value={interview.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <SubmitButton
                        className="btn btn-ghost"
                        idleLabel="Annuler"
                        pendingLabel="Annulation..."
                      />
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="form-caption">Aucun entretien n'est encore planifie sur ce dossier.</p>
        )}
      </div>

      <form action={scheduleAction} className="status-form">
        <input type="hidden" name="application_id" value={applicationId} />
        <input type="hidden" name="timezone" value={timezone} />

        <div className="form-grid">
          <label className="field">
            <span>Debut</span>
            <input type="datetime-local" name="starts_at" required />
          </label>
          <label className="field">
            <span>Fin</span>
            <input type="datetime-local" name="ends_at" />
          </label>
          <label className="field">
            <span>Format</span>
            <select name="format" defaultValue="video">
              {interviewFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Intervenant</span>
            <input name="interviewer_name" placeholder="Nom du recruteur ou manager" required />
          </label>
          <label className="field">
            <span>Email intervenant</span>
            <input name="interviewer_email" type="email" placeholder="manager@entreprise.com" />
          </label>
          <label className="field">
            <span>Lieu ou salle</span>
            <input name="location" placeholder="Bureau, agence ou salle de reunion" />
          </label>
          <label className="field field--full">
            <span>Lien visio</span>
            <input name="meeting_url" type="url" placeholder="https://meet.google.com/..." />
          </label>
          <label className="field field--full">
            <span>Notes de cadrage</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Points a couvrir, consignes d'accueil, preparation attendue..."
            />
          </label>
        </div>

        {scheduleState.message ? (
          <p className={scheduleState.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {scheduleState.message}
          </p>
        ) : null}

        {statusState.message ? (
          <p className={statusState.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {statusState.message}
          </p>
        ) : null}

        <SubmitButton
          className="btn btn-secondary btn-block"
          idleLabel="Planifier un entretien"
          pendingLabel="Planification..."
        />
      </form>
    </div>
  );
}
