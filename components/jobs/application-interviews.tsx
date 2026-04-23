"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  scheduleInterviewAction,
  updateInterviewStatusAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewFormatLabel,
  getInterviewStatusMeta,
  interviewFormatOptions
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
      </div>

      <div className="application-interviews__list">
        {interviews.length > 0 ? (
          interviews.map((interview) => {
            const statusMeta = getInterviewStatusMeta(interview.status);

            return (
              <article key={interview.id} className="document-card interview-card">
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
