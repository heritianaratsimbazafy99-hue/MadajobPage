import { formatDisplayDate } from "@/lib/format";
import type { JobAuditEvent } from "@/lib/types";

type JobHistoryPanelProps = {
  events: JobAuditEvent[];
};

function getEventLabel(action: string) {
  if (action === "job_created") {
    return "Creation de l'offre";
  }

  if (action === "job_updated") {
    return "Mise a jour du contenu";
  }

  if (action === "job_status_changed") {
    return "Changement de statut";
  }

  return action;
}

function getEventSummary(event: JobAuditEvent) {
  if (event.action === "job_status_changed") {
    const fromStatus = String(event.metadata.from_status ?? "");
    const toStatus = String(event.metadata.to_status ?? "");
    return `Transition ${fromStatus || "inconnue"} → ${toStatus || "inconnue"}`;
  }

  if (event.action === "job_created") {
    return `Statut initial : ${String(event.metadata.status ?? "draft")}`;
  }

  if (event.action === "job_updated") {
    return `Contenu et parametrage de l'offre mis a jour.`;
  }

  return "Evenement enregistre dans l'historique.";
}

export function JobHistoryPanel({ events }: JobHistoryPanelProps) {
  return (
    <div className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Historique</p>
          <h2>Trace recente de cette offre</h2>
        </div>
        <span className="tag">{events.length} evenement(s)</span>
      </div>

      <div className="dashboard-list">
        {events.length > 0 ? (
          events.map((event) => (
            <article key={event.id} className="panel list-card dashboard-card">
              <div className="dashboard-card__top">
                <h3>{getEventLabel(event.action)}</h3>
                <span className="tag">{formatDisplayDate(event.created_at)}</span>
              </div>
              <p>{getEventSummary(event)}</p>
              <small>
                Par {event.actor_name}
                {event.actor_email ? ` · ${event.actor_email}` : ""}
              </small>
            </article>
          ))
        ) : (
          <article className="panel list-card dashboard-card dashboard-card--empty">
            <h3>Historique non disponible pour l'instant</h3>
            <p>Les prochaines actions de publication, fermeture et edition apparaitront ici.</p>
          </article>
        )}
      </div>
    </div>
  );
}
