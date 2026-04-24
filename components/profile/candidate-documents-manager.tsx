"use client";

import { startTransition, useDeferredValue, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadCandidateDocumentAction } from "@/app/actions/profile-actions";
import {
  getCandidateDocumentTypeMeta,
  supplementaryDocumentTypeOptions
} from "@/lib/candidate-documents";
import { summarizeCandidateDocuments } from "@/lib/candidate-document-insights";
import { validateCandidateUploadFile } from "@/lib/candidate-document-validation";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDocumentData } from "@/lib/types";

type CandidateDocumentsManagerProps = {
  documents: CandidateDocumentData[];
};

type Filters = {
  query: string;
  type: string;
  focus: "" | "recent" | "application_ready" | "administrative";
  sort: "priority_desc" | "recent" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  type: "",
  focus: "",
  sort: "priority_desc"
};

function isRecentDocument(document: CandidateDocumentData) {
  const ageDays = (Date.now() - new Date(document.created_at).getTime()) / 86_400_000;
  return ageDays <= 30;
}

function isApplicationReadyDocument(document: CandidateDocumentData) {
  return (
    document.document_type === "cover_letter" ||
    document.document_type === "portfolio" ||
    document.document_type === "recommendation"
  );
}

function isAdministrativeDocument(document: CandidateDocumentData) {
  return document.document_type === "identity" || document.document_type === "certificate";
}

function getDocumentPriorityScore(document: CandidateDocumentData) {
  let score = 0;

  if (document.is_primary) {
    score += 260;
  }

  if (isApplicationReadyDocument(document)) {
    score += 180;
  }

  if (isAdministrativeDocument(document)) {
    score += 140;
  }

  if (isRecentDocument(document)) {
    score += 60;
  }

  if (document.document_type === "cv") {
    score += 120;
  }

  return score;
}

function getDocumentUsageHint(document: CandidateDocumentData) {
  if (document.document_type === "cover_letter") {
    return "Utile pour accelerer des candidatures ciblees ou personnalisees.";
  }

  if (document.document_type === "portfolio") {
    return "Piece ideale pour illustrer vos realisations et missions concretes.";
  }

  if (document.document_type === "recommendation") {
    return "Peut renforcer un dossier deja avance ou une candidature selective.";
  }

  if (document.document_type === "identity" || document.document_type === "certificate") {
    return "Document pratique a conserver pret si une verification ou une suite administrative arrive vite.";
  }

  if (document.document_type === "cv") {
    return "Document principal de reference rattache a vos candidatures.";
  }

  return "Piece complementaire disponible dans votre espace candidat.";
}

export function CandidateDocumentsManager({
  documents
}: CandidateDocumentsManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string>("portfolio");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({
    kind: "idle",
    message: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(filters.query);

  const workspaceSummary = useMemo(() => summarizeCandidateDocuments(documents), [documents]);

  const supplementaryDocuments = useMemo(
    () => documents.filter((document) => document.document_type !== "cv"),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    const matchingDocuments = supplementaryDocuments.filter((document) => {
      const documentMeta = getCandidateDocumentTypeMeta(document.document_type);
      const matchesQuery =
        !query ||
        [document.file_name, document.document_type, documentMeta.label, documentMeta.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesType = !filters.type || document.document_type === filters.type;
      const matchesFocus =
        !filters.focus ||
        (filters.focus === "recent" && isRecentDocument(document)) ||
        (filters.focus === "application_ready" && isApplicationReadyDocument(document)) ||
        (filters.focus === "administrative" && isAdministrativeDocument(document));

      return matchesQuery && matchesType && matchesFocus;
    });

    return matchingDocuments.sort((left, right) => {
      if (filters.sort === "priority_desc") {
        const leftScore = getDocumentPriorityScore(left);
        const rightScore = getDocumentPriorityScore(right);

        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
      }

      const leftDate = new Date(left.created_at).getTime();
      const rightDate = new Date(right.created_at).getTime();

      return filters.sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [deferredQuery, filters.focus, filters.sort, filters.type, supplementaryDocuments]);

  const filteredStats = useMemo(() => {
    let recent = 0;
    let applicationReady = 0;
    let administrative = 0;

    for (const document of filteredDocuments) {
      if (isRecentDocument(document)) {
        recent += 1;
      }

      if (isApplicationReadyDocument(document)) {
        applicationReady += 1;
      }

      if (isAdministrativeDocument(document)) {
        administrative += 1;
      }
    }

    return {
      recent,
      applicationReady,
      administrative
    };
  }, [filteredDocuments]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = inputRef.current?.files?.[0];

    if (!file) {
      setStatus({
        kind: "error",
        message: "Selectionnez un document avant de lancer l'envoi."
      });
      return;
    }

    const validationError = validateCandidateUploadFile(file, "supplementary");

    if (validationError) {
      setStatus({
        kind: "error",
        message: validationError
      });
      return;
    }

    setIsUploading(true);
    setStatus({
      kind: "idle",
      message: ""
    });

    try {
      const result = await uploadCandidateDocumentAction(new FormData(event.currentTarget));

      if (result.status === "error") {
        setStatus({
          kind: "error",
          message: result.message
        });
        return;
      }

      setStatus({
        kind: "success",
        message: result.message
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleOpenDocument(document: CandidateDocumentData) {
    if (!isSupabaseConfigured) {
      return;
    }

    setOpeningDocumentId(document.id);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(document.bucket_id)
        .createSignedUrl(document.storage_path, 60 * 20);

      if (error || !data?.signedUrl) {
        setStatus({
          kind: "error",
          message: error?.message ?? "Impossible d'ouvrir ce document pour le moment."
        });
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningDocumentId(null);
    }
  }

  return (
    <div id="documents-complementaires" className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Documents complementaires</p>
          <h2>Centralisez vos pieces utiles</h2>
        </div>
        <span className="tag">{supplementaryDocuments.length} document(s)</span>
      </div>

      <p className="form-caption">
        Ajoutez ici vos pieces reutilisables: lettre de motivation, portfolio, certificats,
        references ou autres justificatifs utiles.
      </p>

      <div className="candidate-documents-summary-grid">
        <article className="document-card">
          <strong>{workspaceSummary.readinessLabel}</strong>
          <p>{workspaceSummary.readinessDescription}</p>
          <small>
            {workspaceSummary.missingRecommendedTypes.length > 0
              ? `${workspaceSummary.missingRecommendedTypes.length} type(s) recommande(s) restent encore a couvrir.`
              : "Les types de documents les plus utiles sont deja representes."}
          </small>
        </article>
        <article className="document-card">
          <strong>Priorites recommandees</strong>
          <ul className="dashboard-mini-list dashboard-mini-list--compact">
            {workspaceSummary.nextActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <form className="dashboard-upload-card" onSubmit={handleUpload}>
        <div className="form-grid">
          <label className="field">
            <span>Type de document</span>
            <select
              name="document_type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              {supplementaryDocumentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--full">
            <span>Choisir un fichier</span>
            <input
              ref={inputRef}
              name="document_file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            />
          </label>
        </div>

        <p className="form-caption">
          Formats acceptes : PDF, DOC, DOCX, PNG, JPG. Taille maximale recommandee : 10 Mo.
        </p>

        {status.message ? (
          <p className={status.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {status.message}
          </p>
        ) : null}

        <button className="btn btn-primary btn-block" type="submit" disabled={isUploading}>
          {isUploading ? "Televersement..." : "Ajouter un document complementaire"}
        </button>
      </form>

      <section className="dashboard-form candidate-documents-board">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Bibliotheque documentaire</p>
            <h2>Retrouvez vite les pieces les plus utiles</h2>
          </div>
          <span className="tag">{filteredDocuments.length} resultat(s)</span>
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
              placeholder="Nom du fichier, type de document..."
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  type: event.target.value
                }))
              }
            >
              <option value="">Tous les types</option>
              {supplementaryDocumentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Focus</span>
            <select
              value={filters.focus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  focus: event.target.value as Filters["focus"]
                }))
              }
            >
              <option value="">Vue globale</option>
              <option value="recent">Ajouts recents</option>
              <option value="application_ready">Candidatures ciblees</option>
              <option value="administrative">Administratif</option>
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
              <option value="priority_desc">Priorite</option>
              <option value="recent">Plus recents</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{filteredStats.recent}</strong>
            <p>ajout(s) recents</p>
          </article>
          <article className="document-card">
            <strong>{filteredStats.applicationReady}</strong>
            <p>piece(s) pour candidatures ciblees</p>
          </article>
          <article className="document-card">
            <strong>{filteredStats.administrative}</strong>
            <p>piece(s) administratives</p>
          </article>
          <article className="document-card">
            <strong>{workspaceSummary.distinctSupplementaryTypes}</strong>
            <p>type(s) couverts dans votre bibliotheque</p>
          </article>
        </div>

        <div className="dashboard-list">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((document) => {
              const documentMeta = getCandidateDocumentTypeMeta(document.document_type);

              return (
                <article key={document.id} className="panel list-card dashboard-card">
                  <div className="dashboard-card__top">
                    <div>
                      <h3>{document.file_name}</h3>
                      <p>{documentMeta.label}</p>
                    </div>
                    <div className="dashboard-card__badges">
                      {isRecentDocument(document) ? <span className="tag tag--info">Recent</span> : null}
                      {isApplicationReadyDocument(document) ? (
                        <span className="tag tag--success">Ciblage candidature</span>
                      ) : null}
                      {isAdministrativeDocument(document) ? (
                        <span className="tag tag--muted">Administratif</span>
                      ) : null}
                    </div>
                  </div>

                  <p>{documentMeta.description}</p>

                  <div className="document-meta">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>Ajoute le {formatDisplayDate(document.created_at)}</span>
                  </div>

                  <div className="notification-signal-card">
                    <strong>Usage recommande</strong>
                    <p>{getDocumentUsageHint(document)}</p>
                    <small>{document.bucket_id}</small>
                  </div>

                  <div className="job-card__footer">
                    <small>Le document reste disponible dans votre espace candidat.</small>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleOpenDocument(document)}
                      disabled={openingDocumentId === document.id}
                    >
                      {openingDocumentId === document.id ? "Ouverture..." : "Ouvrir le document"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="panel list-card dashboard-card dashboard-card--empty">
              <h3>Aucun document complementaire dans cette vue</h3>
              <p>
                Ajustez les filtres ou ajoutez une lettre, un portfolio ou un certificat pour
                enrichir votre dossier candidat.
              </p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
