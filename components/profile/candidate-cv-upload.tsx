"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadCandidateCvAction } from "@/app/actions/profile-actions";
import { validateCandidateUploadFile } from "@/lib/candidate-document-validation";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import type { CandidateDocumentData } from "@/lib/types";

type CandidateCvUploadProps = {
  currentDocument: CandidateDocumentData | null;
  recentDocuments: CandidateDocumentData[];
};

export function CandidateCvUpload({
  currentDocument,
  recentDocuments
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

    const file = inputRef.current?.files?.[0];

    if (!file) {
      setStatus({
        kind: "error",
        message: "Selectionnez un CV avant de lancer l'envoi."
      });
      return;
    }

    const validationError = validateCandidateUploadFile(file, "cv");

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
      const result = await uploadCandidateCvAction(new FormData(event.currentTarget));

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

      <div className="document-card">
        <strong>Historique recent</strong>
        {recentDocuments.length > 0 ? (
          <div className="dashboard-upload-history">
            {recentDocuments.map((document) => (
              <div key={document.id} className="dashboard-upload-history__item">
                <div>
                  <strong>{document.file_name}</strong>
                  <div className="document-meta">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>Ajoute le {formatDisplayDate(document.created_at)}</span>
                  </div>
                </div>
                <span className="tag">{document.is_primary ? "Principal" : "Archive"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="form-caption">
            Aucun document charge pour le moment. Le premier CV depose apparaitra ici.
          </p>
        )}
      </div>

      <label className="field field--full">
        <span>Choisir un fichier</span>
        <input
          ref={inputRef}
          name="cv_file"
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
