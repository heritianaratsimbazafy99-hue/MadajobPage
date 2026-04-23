"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  applyInterviewDecisionAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { applicationStatusOptions, getApplicationStatusMeta } from "@/lib/application-status";
import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getSuggestedApplicationStatusFromInterviewDecision
} from "@/lib/interviews";
import type { ApplicationInterview } from "@/lib/types";

const initialState: ApplicationActionState = {
  status: "idle",
  message: ""
};

type ApplicationDecisionFormProps = {
  applicationId: string;
  currentStatus: string;
  interviews: ApplicationInterview[];
};

function getLatestInterviewWithFeedback(interviews: ApplicationInterview[]) {
  return interviews
    .filter((interview) => Boolean(interview.feedback))
    .slice()
    .sort((left, right) => {
      const leftUpdated = new Date(left.feedback?.updated_at ?? left.updated_at).getTime();
      const rightUpdated = new Date(right.feedback?.updated_at ?? right.updated_at).getTime();
      return rightUpdated - leftUpdated;
    })[0] ?? null;
}

export function ApplicationDecisionForm({
  applicationId,
  currentStatus,
  interviews
}: ApplicationDecisionFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(applyInterviewDecisionAction, initialState);
  const [, startTransition] = useTransition();
  const latestInterview = useMemo(() => getLatestInterviewWithFeedback(interviews), [interviews]);
  const latestFeedback = latestInterview?.feedback ?? null;
  const suggestedStatus = latestFeedback
    ? getSuggestedApplicationStatusFromInterviewDecision(
        latestFeedback.proposed_decision,
        latestFeedback.next_action
      )
    : currentStatus;
  const [selectedStatus, setSelectedStatus] = useState(suggestedStatus);

  useEffect(() => {
    setSelectedStatus(suggestedStatus);
  }, [suggestedStatus]);

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition, state.status]);

  if (!latestInterview || !latestFeedback) {
    return (
      <div className="application-decision-panel">
        <p className="form-caption">
          La decision post-entretien apparaitra ici des qu'un compte-rendu structure sera saisi.
        </p>
      </div>
    );
  }

  const recommendationMeta = getInterviewRecommendationMeta(latestFeedback.recommendation);
  const proposedDecisionMeta = getInterviewProposedDecisionMeta(latestFeedback.proposed_decision);
  const suggestedStatusMeta = getApplicationStatusMeta(suggestedStatus);
  const currentStatusMeta = getApplicationStatusMeta(currentStatus);

  return (
    <div className="application-decision-panel">
      <div className="application-decision-panel__summary">
        <div className="dashboard-card__top">
          <div>
            <strong>{proposedDecisionMeta.label}</strong>
            <p>{getInterviewNextActionLabel(latestFeedback.next_action)}</p>
          </div>
          <div className="dashboard-card__badges">
            <span className={`tag tag--${recommendationMeta.tone}`}>{recommendationMeta.label}</span>
            <span className={`tag tag--${proposedDecisionMeta.tone}`}>{proposedDecisionMeta.label}</span>
          </div>
        </div>

        <p>{latestFeedback.summary}</p>

        <div className="document-meta">
          <span>Entretien source : {formatDateTimeDisplay(latestInterview.starts_at)}</span>
          <span>Statut suggere : {suggestedStatusMeta.label}</span>
        </div>

        <div className="form-grid">
          <div className="document-card">
            <strong>Points forts</strong>
            <p>{latestFeedback.strengths}</p>
          </div>
          <div className="document-card">
            <strong>Points de vigilance</strong>
            <p>{latestFeedback.concerns}</p>
          </div>
        </div>

        {currentStatus === suggestedStatus ? (
          <p className="form-caption">
            Le statut suggere correspond deja au statut actuel ({currentStatusMeta.label}). Cette
            action servira surtout a journaliser la decision et votre commentaire interne.
          </p>
        ) : (
          <p className="form-caption">
            Le dossier est actuellement au statut {currentStatusMeta.label}. Vous pouvez appliquer
            directement la decision ou ajuster le statut cible avant validation.
          </p>
        )}
      </div>

      <form action={formAction} className="status-form">
        <input type="hidden" name="application_id" value={applicationId} />
        <input type="hidden" name="interview_id" value={latestInterview.id} />

        <div className="form-grid">
          <label className="field">
            <span>Statut cible</span>
            <select
              name="status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              {applicationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--full">
            <span>Commentaire interne de decision</span>
            <textarea
              name="decision_note"
              rows={3}
              placeholder="Ex. valider en comite, planifier un dernier echange manager, attendre le retour references..."
            />
          </label>
        </div>

        {state.message ? (
          <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {state.message}
          </p>
        ) : null}

        <SubmitButton
          className="btn btn-secondary btn-block"
          idleLabel="Appliquer la decision post-entretien"
          pendingLabel="Application..."
        />
      </form>
    </div>
  );
}
