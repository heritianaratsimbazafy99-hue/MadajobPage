"use client";

import Link from "next/link";
import {
  type DragEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react";
import { useRouter } from "next/navigation";

import {
  bulkMoveApplicationsStatusAction,
  moveApplicationStatusAction
} from "@/app/actions/application-actions";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import {
  applicationStatusOptions,
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import {
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getInterviewStatusMeta
} from "@/lib/interviews";
import type { RecruiterApplication } from "@/lib/types";

type ManagedApplicationsBoardProps = {
  applications: RecruiterApplication[];
  basePath: "/app/recruteur/candidatures" | "/app/admin/candidatures";
};

type Filters = {
  query: string;
  status: string;
  withCvOnly: boolean;
  stage: "" | "active" | "final" | "shortlist" | "interview";
  signalFocus:
    | ""
    | "upcoming_interview"
    | "feedback_ready"
    | "feedback_missing"
    | "favorable_feedback"
    | "watchout_feedback";
  view: "list" | "pipeline";
  sort: "priority_desc" | "recent" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  withCvOnly: false,
  stage: "",
  signalFocus: "",
  view: "pipeline",
  sort: "priority_desc"
};

function getUniqueStatuses(applications: RecruiterApplication[]) {
  return Array.from(new Set(applications.map((application) => application.status))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function hasFavorableFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "strong_yes" || recommendation === "yes";
}

function hasWatchoutFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "mixed" || recommendation === "no";
}

function getApplicationPriorityScore(application: RecruiterApplication) {
  let score = 0;

  if (application.status === "interview") {
    score += 120;
  }

  if (application.status === "shortlist") {
    score += 60;
  }

  if (application.interview_signal.pending_feedback) {
    score += 240;
  }

  if (application.interview_signal.next_interview_at) {
    score += 150;
  }

  const latestFeedback = application.interview_signal.latest_feedback;

  if (latestFeedback?.proposed_decision === "hire") {
    score += 110;
  }

  if (latestFeedback?.proposed_decision === "advance") {
    score += 90;
  }

  if (latestFeedback?.recommendation === "strong_yes") {
    score += 80;
  }

  if (latestFeedback?.recommendation === "yes") {
    score += 60;
  }

  if (latestFeedback?.recommendation === "mixed") {
    score += 20;
  }

  if (latestFeedback?.recommendation === "no") {
    score -= 30;
  }

  if (!application.has_cv) {
    score -= 20;
  }

  return score;
}

export function ManagedApplicationsBoard({
  applications,
  basePath
}: ManagedApplicationsBoardProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [boardApplications, setBoardApplications] = useState(applications);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    setBoardApplications(applications);
  }, [applications]);

  const statusOptions = useMemo(() => getUniqueStatuses(boardApplications), [boardApplications]);

  const filteredApplications = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return boardApplications
      .filter((application) => {
        const latestFeedback = application.interview_signal.latest_feedback;
        const matchesQuery =
          !query ||
          [
            application.candidate_name,
            application.candidate_email,
            application.job_title,
            application.job_location,
            latestFeedback?.summary ?? ""
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));

        const matchesStatus = !filters.status || application.status === filters.status;
        const matchesCv = !filters.withCvOnly || application.has_cv;
        const matchesStage =
          !filters.stage ||
          (filters.stage === "active" && !isFinalApplicationStatus(application.status)) ||
          (filters.stage === "final" && isFinalApplicationStatus(application.status)) ||
          (filters.stage === "shortlist" && application.status === "shortlist") ||
          (filters.stage === "interview" && application.status === "interview");
        const matchesSignalFocus =
          !filters.signalFocus ||
          (filters.signalFocus === "upcoming_interview" &&
            Boolean(application.interview_signal.next_interview_at)) ||
          (filters.signalFocus === "feedback_ready" &&
            Boolean(application.interview_signal.latest_feedback)) ||
          (filters.signalFocus === "feedback_missing" &&
            application.interview_signal.pending_feedback) ||
          (filters.signalFocus === "favorable_feedback" &&
            hasFavorableFeedback(application)) ||
          (filters.signalFocus === "watchout_feedback" &&
            hasWatchoutFeedback(application));

        return matchesQuery && matchesStatus && matchesCv && matchesStage && matchesSignalFocus;
      })
      .sort((left, right) => {
        if (filters.sort === "priority_desc") {
          const leftScore = getApplicationPriorityScore(left);
          const rightScore = getApplicationPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        const leftUpdated = new Date(left.updated_at ?? left.created_at).getTime();
        const rightUpdated = new Date(right.updated_at ?? right.created_at).getTime();

        if (filters.sort === "oldest") {
          return leftUpdated - rightUpdated;
        }

        return rightUpdated - leftUpdated;
      });
  }, [
    boardApplications,
    deferredQuery,
    filters.signalFocus,
    filters.sort,
    filters.stage,
    filters.status,
    filters.withCvOnly
  ]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const application of filteredApplications) {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    }

    return counts;
  }, [filteredApplications]);

  const signalStats = useMemo(() => {
    let upcoming = 0;
    let pendingFeedback = 0;
    let favorable = 0;
    let ready = 0;

    for (const application of filteredApplications) {
      if (application.interview_signal.next_interview_at) {
        upcoming += 1;
      }

      if (application.interview_signal.pending_feedback) {
        pendingFeedback += 1;
      }

      if (application.interview_signal.latest_feedback) {
        ready += 1;
      }

      if (hasFavorableFeedback(application)) {
        favorable += 1;
      }
    }

    return { upcoming, pendingFeedback, favorable, ready };
  }, [filteredApplications]);

  const pipelineColumns = useMemo(
    () =>
      applicationStatusOptions.map((option) => ({
        ...option,
        applications: filteredApplications.filter((application) => application.status === option.value)
      })),
    [filteredApplications]
  );

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.withCvOnly ? "cv" : "",
    filters.stage,
    filters.signalFocus,
    filters.view !== "pipeline" ? filters.view : "",
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;
  const selectedCount = selectedApplicationIds.length;
  const allVisibleSelected =
    filteredApplications.length > 0 && selectedCount === filteredApplications.length;

  useEffect(() => {
    const visibleIds = new Set(filteredApplications.map((application) => application.id));
    setSelectedApplicationIds((previous) =>
      previous.filter((applicationId) => visibleIds.has(applicationId))
    );
  }, [filteredApplications]);

  function updateLocalApplicationStatus(applicationId: string, status: string) {
    setBoardApplications((previous) =>
      previous.map((application) =>
        application.id === applicationId ? { ...application, status } : application
      )
    );
  }

  function updateManyLocalApplicationStatuses(applicationIds: string[], status: string) {
    const selectedIds = new Set(applicationIds);
    setBoardApplications((previous) =>
      previous.map((application) =>
        selectedIds.has(application.id) ? { ...application, status } : application
      )
    );
  }

  function toggleApplicationSelection(applicationId: string) {
    setSelectedApplicationIds((previous) =>
      previous.includes(applicationId)
        ? previous.filter((currentId) => currentId !== applicationId)
        : [...previous, applicationId]
    );
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedApplicationIds([]);
      return;
    }

    setSelectedApplicationIds(filteredApplications.map((application) => application.id));
  }

  function handleDragStart(event: DragEvent<HTMLElement>, applicationId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", applicationId);
    setDraggedApplicationId(applicationId);
    setFeedback(null);
  }

  function handleDragEnd() {
    setDraggedApplicationId(null);
    setDropTargetStatus(null);
  }

  async function handleDrop(nextStatus: string) {
    if (!draggedApplicationId || isPending) {
      return;
    }

    const draggedApplication = boardApplications.find(
      (application) => application.id === draggedApplicationId
    );

    if (!draggedApplication || draggedApplication.status === nextStatus) {
      handleDragEnd();
      return;
    }

    const previousStatus = draggedApplication.status;
    updateLocalApplicationStatus(draggedApplicationId, nextStatus);
    setDropTargetStatus(null);
    setDraggedApplicationId(null);
    setFeedback(null);

    startTransition(() => {
      void moveApplicationStatusAction(draggedApplicationId, nextStatus)
        .then((result) => {
          if (result.status === "error") {
            updateLocalApplicationStatus(draggedApplicationId, previousStatus);
            setFeedback({
              kind: "error",
              message: result.message
            });
            return;
          }

          setFeedback({
            kind: "success",
            message: result.message
          });
          router.refresh();
        })
        .catch(() => {
          updateLocalApplicationStatus(draggedApplicationId, previousStatus);
          setFeedback({
            kind: "error",
            message: "Le deplacement du dossier a echoue. Reessayez."
          });
        });
    });
  }

  function handleBulkStatusChange() {
    if (!bulkStatus || !selectedApplicationIds.length || isPending) {
      return;
    }

    const previousStatuses = new Map(
      selectedApplicationIds
        .map((applicationId) => {
          const application = boardApplications.find((item) => item.id === applicationId);
          return application ? [applicationId, application.status] : null;
        })
        .filter(Boolean) as Array<[string, string]>
    );

    const idsToUpdate = Array.from(previousStatuses.entries())
      .filter(([, currentStatus]) => currentStatus !== bulkStatus)
      .map(([applicationId]) => applicationId);

    if (!idsToUpdate.length) {
      setFeedback({
        kind: "success",
        message: "Les dossiers selectionnes sont deja sur ce statut."
      });
      return;
    }

    updateManyLocalApplicationStatuses(idsToUpdate, bulkStatus);
    setFeedback(null);

    startTransition(() => {
      void bulkMoveApplicationsStatusAction(idsToUpdate, bulkStatus)
        .then((result) => {
          if (result.status === "error") {
            setBoardApplications((previous) =>
              previous.map((application) => {
                const previousStatus = previousStatuses.get(application.id);
                return previousStatus
                  ? { ...application, status: previousStatus }
                  : application;
              })
            );
            setFeedback({
              kind: "error",
              message: result.message
            });
            return;
          }

          setSelectedApplicationIds([]);
          setBulkStatus("");
          setFeedback({
            kind: "success",
            message: result.message
          });
          router.refresh();
        })
        .catch(() => {
          setBoardApplications((previous) =>
            previous.map((application) => {
              const previousStatus = previousStatuses.get(application.id);
              return previousStatus
                ? { ...application, status: previousStatus }
                : application;
            })
          );
          setFeedback({
            kind: "error",
            message: "La mise a jour groupee a echoue. Reessayez."
          });
        });
    });
  }

  function renderInterviewSignal(application: RecruiterApplication) {
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
          <p className="form-caption">Aucun signal entretien structure sur ce dossier pour le moment.</p>
        )}
      </div>
    );
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Gestion des candidatures</p>
            <h2>Retrouvez rapidement les dossiers a traiter avec les signaux d'entretien et de decision</h2>
          </div>
          <span className="tag">{filteredApplications.length} dossier(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  query: event.target.value
                }))
              }
              placeholder="Nom candidat, email, offre, lieu, resume feedback..."
            />
          </label>

          <label className="field">
            <span>Statut</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value
                }))
              }
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {getApplicationStatusMeta(option).label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Focus pipeline</span>
            <select
              value={filters.stage}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  stage: event.target.value as Filters["stage"]
                }))
              }
            >
              <option value="">Tous les dossiers</option>
              <option value="active">En cours</option>
              <option value="shortlist">Shortlist</option>
              <option value="interview">Entretiens</option>
              <option value="final">Finalises</option>
            </select>
          </label>

          <label className="field">
            <span>Signal entretien</span>
            <select
              value={filters.signalFocus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  signalFocus: event.target.value as Filters["signalFocus"]
                }))
              }
            >
              <option value="">Tous les signaux</option>
              <option value="upcoming_interview">Entretien a venir</option>
              <option value="feedback_ready">Feedback saisi</option>
              <option value="feedback_missing">Feedback a saisir</option>
              <option value="favorable_feedback">Feedback favorable</option>
              <option value="watchout_feedback">Feedback avec reserves</option>
            </select>
          </label>

          <label className="field">
            <span>Affichage</span>
            <select
              value={filters.view}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  view: event.target.value as Filters["view"]
                }))
              }
            >
              <option value="pipeline">Pipeline</option>
              <option value="list">Liste</option>
            </select>
          </label>

          <label className="field">
            <span>Tri</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  sort: event.target.value as Filters["sort"]
                }))
              }
            >
              <option value="priority_desc">Priorite d'action</option>
              <option value="recent">Derniers mouvements</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.withCvOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  withCvOnly: event.target.checked
                }))
              }
            />
            <span>Afficher uniquement les dossiers avec CV joint</span>
          </label>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            {applicationStatusOptions.map((option) => {
              const count = statusCounts.get(option.value) ?? 0;

              return (
                <span key={option.value} className="tag tag--muted">
                  {option.label} · {count}
                </span>
              );
            })}
            <span className="tag tag--info">{signalStats.upcoming} entretien(s) a venir</span>
            <span className="tag tag--danger">{signalStats.pendingFeedback} feedback(s) a saisir</span>
            <span className="tag tag--success">{signalStats.favorable} feedback(s) favorables</span>
          </div>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFilters(initialFilters)}
            >
              Reinitialiser les filtres
            </button>
          ) : null}
        </div>

        <div className="bulk-toolbar">
          <label className="checkbox-field bulk-toolbar__select-all">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
            />
            <span>
              {allVisibleSelected ? "Tout deselectionner" : "Selectionner tous les dossiers visibles"}
            </span>
          </label>

          <div className="bulk-toolbar__content">
            <span className="tag tag--muted">{selectedCount} dossier(s) selectionne(s)</span>

            <label className="field">
              <span>Action groupee</span>
              <select
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value)}
                disabled={selectedCount === 0 || isPending}
              >
                <option value="">Choisir un statut</option>
                {applicationStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={!bulkStatus || selectedCount === 0 || isPending}
              onClick={handleBulkStatusChange}
            >
              {isPending ? "Traitement..." : "Appliquer"}
            </button>
          </div>
        </div>

        <p className="form-caption">
          {filters.view === "pipeline"
            ? "Glissez une carte vers une autre colonne pour faire avancer le dossier dans le pipeline, ou utilisez les filtres de priorisation pour faire ressortir les urgences."
            : "Passez en vue pipeline pour reorganiser les dossiers par glisser-deposer, ou restez en liste pour traiter plus vite les signaux d'entretien et de feedback."}
        </p>

        {feedback ? (
          <p className={feedback.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      {filteredApplications.length > 0 ? (
        filters.view === "pipeline" ? (
          <section className="pipeline-board">
            {pipelineColumns.map((column) => (
              <article
                key={column.value}
                className={[
                  "panel pipeline-column",
                  dropTargetStatus === column.value ? "is-drop-target" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!isPending) {
                    event.dataTransfer.dropEffect = "move";
                    setDropTargetStatus(column.value);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetStatus === column.value) {
                    setDropTargetStatus(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleDrop(column.value);
                }}
              >
                <div className="pipeline-column__head">
                  <div>
                    <p className="eyebrow">{column.label}</p>
                    <h2>{column.applications.length} dossier(s)</h2>
                  </div>
                  <span className="tag tag--muted">{column.value}</span>
                </div>

                <p className="form-caption">{column.description}</p>

                <div className="pipeline-column__list">
                  {column.applications.length > 0 ? (
                    column.applications.map((application) => {
                      const statusMeta = getApplicationStatusMeta(application.status);
                      const isDragging = draggedApplicationId === application.id;
                      const isSelected = selectedApplicationIds.includes(application.id);

                      return (
                        <article
                          key={application.id}
                          className={[
                            "document-card pipeline-card",
                            isSelected ? "is-selected" : "",
                            isDragging ? "is-dragging" : "",
                            isPending ? "is-disabled" : ""
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          draggable={!isPending}
                          onDragStart={(event) => handleDragStart(event, application.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <label className="checkbox-field pipeline-card__select">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleApplicationSelection(application.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <span>Selectionner ce dossier</span>
                          </label>

                          <div className="dashboard-card__top">
                            <div>
                              <strong>{application.candidate_name}</strong>
                              <p>{application.job_title}</p>
                            </div>
                            <span className="tag tag--muted">{statusMeta.label}</span>
                          </div>

                          <div className="job-card__meta">
                            <span>{application.job_location}</span>
                            <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                          </div>

                          <small>{application.candidate_email}</small>
                          {renderInterviewSignal(application)}
                          <small className="pipeline-card__hint">
                            Glisser vers une autre etape pour changer le statut
                          </small>

                          <div className="job-card__footer">
                            <small>
                              Dernier mouvement le{" "}
                              {formatDisplayDate(application.updated_at ?? application.created_at)}
                            </small>
                            <Link href={`${basePath}/${application.id}`}>Ouvrir</Link>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <article className="document-card pipeline-card pipeline-card--empty">
                      <strong>Aucun dossier</strong>
                      <p>Cette etape du pipeline est vide avec les filtres actuels.</p>
                    </article>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="jobs-results">
            {filteredApplications.map((application) => {
              const statusMeta = getApplicationStatusMeta(application.status);
              const isSelected = selectedApplicationIds.includes(application.id);

              return (
                <article
                  key={application.id}
                  className={["panel jobs-result-card", isSelected ? "is-selected" : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="jobs-result-card__head">
                    <div>
                      <h2>{application.candidate_name}</h2>
                      <p>{application.job_title}</p>
                    </div>
                    <span className="tag tag--muted">{statusMeta.label}</span>
                  </div>

                  <label className="checkbox-field jobs-result-card__select">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleApplicationSelection(application.id)}
                    />
                    <span>Selectionner ce dossier</span>
                  </label>

                  <div className="job-card__meta">
                    <span>{application.candidate_email}</span>
                    <span>{application.job_location}</span>
                    <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                  </div>

                  {renderInterviewSignal(application)}

                  <div className="job-card__footer">
                    <small>
                      Dernier mouvement le {formatDisplayDate(application.updated_at ?? application.created_at)}
                    </small>
                    <Link href={`${basePath}/${application.id}`}>Ouvrir le dossier</Link>
                  </div>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <section className="jobs-results">
          <DashboardEmptyState
            title="Aucun dossier ne correspond a ces filtres"
            description="Repassez sur toute la pile ou basculez vers les entretiens pour retrouver les candidatures a traiter."
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFilters(initialFilters)}
                >
                  Reinitialiser les filtres
                </button>
                <Link
                  className="btn btn-ghost"
                  href={
                    basePath === "/app/admin/candidatures"
                      ? "/app/admin/entretiens"
                      : "/app/recruteur/entretiens"
                  }
                >
                  Ouvrir les entretiens
                </Link>
              </>
            }
          />
        </section>
      )}
    </div>
  );
}
