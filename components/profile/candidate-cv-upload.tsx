"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDisplayDate, formatFileSize } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDocumentData } from "@/lib/types";

type CandidateCvUploadProps = {
  candidateId: string;
  currentDocument: CandidateDocumentData | null;
};

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function CandidateCvUpload({
  candidateId,
  currentDocument
}: CandidateCvUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({
    kind: "idle",
    message: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  const helperText = useMemo(() => {
    if (!currentDocument) {
      return "Ajoutez un CV principal pour l'utiliser automatiquement lors de vos prochaines candidatures.";
    }

    return `CV principal actuel : ${currentDocument.file_name}`;
  }, [currentDocument]);

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
        message: "Selectionnez un CV avant de lancer l'envoi."
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({
        kind: "error",
        message: "Le CV ne doit pas depasser 10 Mo."
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
    const safeName = sanitizeFileName(file.name || `cv.${extension}`);
    const storagePath = `${candidateId}/${Date.now()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("candidate-cv")
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

      const { error: resetError } = await supabase
        .from("candidate_documents")
        .update({ is_primary: false })
        .eq("candidate_id", candidateId)
        .eq("is_primary", true);

      if (resetError) {
        setStatus({
          kind: "error",
          message: resetError.message
        });
        return;
      }

      const { error: insertError } = await supabase.from("candidate_documents").insert({
        candidate_id: candidateId,
        document_type: "cv",
        bucket_id: "candidate-cv",
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        is_primary: true
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
        message: "CV principal televerse. Il sera rattache automatiquement a vos prochaines candidatures."
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

  return (
    <form className="dashboard-form dashboard-upload-card" onSubmit={handleUpload}>
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">CV principal</p>
          <h2>Televerser ou remplacer votre CV</h2>
        </div>
        <span className="tag">{currentDocument ? "Actif" : "A ajouter"}</span>
      </div>

      <p className="form-caption">{helperText}</p>

      {currentDocument ? (
        <div className="document-card">
          <strong>{currentDocument.file_name}</strong>
          <div className="document-meta">
            <span>{formatFileSize(currentDocument.file_size)}</span>
            <span>Ajoute le {formatDisplayDate(currentDocument.created_at)}</span>
          </div>
        </div>
      ) : null}

      <label className="field field--full">
        <span>Choisir un fichier</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </label>

      <p className="form-caption">Formats acceptes : PDF, DOC, DOCX. Taille maximale recommandee : 10 Mo.</p>

      {status.message ? (
        <p className={status.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {status.message}
        </p>
      ) : null}

      <button className="btn btn-primary btn-block" type="submit" disabled={isUploading}>
        {isUploading ? "Televersement..." : currentDocument ? "Remplacer mon CV principal" : "Televerser mon CV principal"}
      </button>
    </form>
  );
}
