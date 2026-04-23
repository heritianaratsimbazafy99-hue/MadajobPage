import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getInterviewStatusMeta
} from "@/lib/interviews";
import type { RecruiterApplication } from "@/lib/types";

type DashboardInterviewSignalCardProps = {
  application: RecruiterApplication;
  emptyMessage?: string;
};

export function DashboardInterviewSignalCard({
  application,
  emptyMessage = "Aucun signal entretien structure sur ce dossier pour le moment."
}: DashboardInterviewSignalCardProps) {
  const latestFeedback = application.interview_signal.latest_feedback;
  const recommendation = latestFeedback
    ? getInterviewRecommendationMeta(latestFeedback.recommendation)
    : null;
  const proposedDecision = latestFeedback
    ? getInterviewProposedDecisionMeta(latestFeedback.proposed_decision)
    : null;
  const latestInterviewStatus = application.interview_signal.latest_interview_status
    ? getInterviewStatusMeta(application.interview_signal.latest_interview_status)
    : null;

  return (
    <div className="application-signal-card">
      <div className="document-meta">
        <span>{application.interview_signal.interviews_count} entretien(s)</span>
        {latestInterviewStatus ? <span>{latestInterviewStatus.label}</span> : <span>Aucun entretien</span>}
        {application.interview_signal.next_interview_at ? (
          <span>Prochain le {formatDateTimeDisplay(application.interview_signal.next_interview_at)}</span>
        ) : null}
      </div>

      {latestFeedback ? (
        <>
          <div className="dashboard-card__badges">
            {recommendation ? (
              <span className={`tag tag--${recommendation.tone}`}>{recommendation.label}</span>
            ) : null}
            {proposedDecision ? (
              <span className={`tag tag--${proposedDecision.tone}`}>{proposedDecision.label}</span>
            ) : null}
          </div>
          <p>{latestFeedback.summary}</p>
          <small>{getInterviewNextActionLabel(latestFeedback.next_action)}</small>
        </>
      ) : application.interview_signal.pending_feedback ? (
        <p className="form-caption">Entretien termine sans compte-rendu. Priorite de mise a jour.</p>
      ) : application.interview_signal.next_interview_at ? (
        <p className="form-caption">Un entretien est planifie. Le dossier est a preparer.</p>
      ) : (
        <p className="form-caption">{emptyMessage}</p>
      )}
    </div>
  );
}
