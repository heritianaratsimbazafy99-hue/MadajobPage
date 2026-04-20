"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCandidateDocumentTypeMeta,
  supplementaryDocumentTypeOptions
} from "@/lib/candidate-documents";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDocumentData } from "@/lib/types";

type CandidateDocumentsManagerProps = {
  candidateId: string;
  documents: CandidateDocumentData[];
};

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function CandidateDocumentsManager({
  candidateId,
  documents
}: CandidateDocumentsManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string>("portfolio");
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({
    kind: "idle",
    message: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);

  const supplementaryDocuments = useMemo(
    () => documents.filter((document) => document.document_type !== "cv"),
    [documents]
  );

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus({
        kind: "error",
        message: "Supabase n'est pas configure pour l'instant."
      });
      return;
    }

    const file = inputRef.current?.files?.[0];

    if (!file) {
      setStatus({
        kind: "error",
        message: "Selectionnez un document avant de lancer l'envoi."
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({
        kind: "error",
        message: "Le document ne doit pas depasser 10 Mo."
      });
      return;
    }

    setIsUploading(true);
    setStatus({
      kind: "idle",
      message: ""
    });

    const supabase = createClient();
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() ?? "pdf"
      : "pdf";
    const safeName = sanitizeFileName(file.name || `document.${extension}`);
    const storagePath = `${candidateId}/${Date.now()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("candidate-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false
        });

      if (uploadError) {
        setStatus({
          kind: "error",
          message: uploadError.message
        });
        return;
      }

      const { error: insertError } = await supabase.from("candidate_documents").insert({
        candidate_id: candidateId,
        document_type: documentType,
        bucket_id: "candidate-documents",
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        is_primary: false
      });

      if (insertError) {
        setStatus({
          kind: "error",
          message: insertError.message
        });
        return;
      }

      setStatus({
        kind: "success",
        message: "Document complementaire ajoute a votre espace candidat."
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
    <div className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Documents complementaires</p>
          <h2>Centraliser vos pieces utiles</h2>
        </div>
        <span className="tag">{supplementaryDocuments.length} document(s)</span>
      </div>

      <p className="form-caption">
        Ajoutez ici vos pieces reutilisables: lettre de motivation, portfolio, certificats,
        references ou autres justificatifs utiles.
      </p>

      <form className="dashboard-upload-card" onSubmit={handleUpload}>
        <div className="form-grid">
          <label className="field">
            <span>Type de document</span>
            <select
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

      <div className="dashboard-list">
        {supplementaryDocuments.length > 0 ? (
          supplementaryDocuments.map((document) => {
            const documentMeta = getCandidateDocumentTypeMeta(document.document_type);

            return (
              <article key={document.id} className="panel list-card dashboard-card">
                <div className="dashboard-card__top">
                  <div>
                    <h3>{document.file_name}</h3>
                    <p>{documentMeta.label}</p>
                  </div>
                  <span className="tag">{documentMeta.label}</span>
                </div>
                <p>{documentMeta.description}</p>
                <div className="job-card__meta">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>Ajoute le {formatDisplayDate(document.created_at)}</span>
                </div>
                <div className="job-card__footer">
                  <small>{document.bucket_id}</small>
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
            <h3>Aucun document complementaire pour le moment</h3>
            <p>
              Commencez par ajouter une lettre, un portfolio ou un certificat pour enrichir votre
              dossier candidat.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
