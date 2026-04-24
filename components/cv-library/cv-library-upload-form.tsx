"use client";

import { useActionState } from "react";

import {
  uploadCvLibraryDocumentsAction,
  type CvLibraryActionState
} from "@/app/actions/cv-library-actions";
import { SubmitButton } from "@/components/jobs/submit-button";

const initialState: CvLibraryActionState = {
  status: "idle",
  message: ""
};

export function CvLibraryUploadForm() {
  const [state, formAction] = useActionState(uploadCvLibraryDocumentsAction, initialState);

  return (
    <form action={formAction} className="dashboard-form cv-library-upload-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Import en masse</p>
          <h2>Ajouter des CV sans compte candidat</h2>
        </div>
        <span className="tag">30 fichiers max</span>
      </div>

      <div className="form-grid">
        <label className="field field--full">
          <span>CV a importer</span>
          <input
            type="file"
            name="cv_files"
            multiple
            accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
          />
        </label>

        <label className="field">
          <span>Source</span>
          <input name="source_label" placeholder="Ex. Salon emploi, LinkedIn, depot manuel" />
        </label>

        <label className="field">
          <span>Tag du lot</span>
          <input name="import_tag" placeholder="Ex. commerciaux-mai" />
        </label>
      </div>

      <div className="document-card">
        <strong>Parsing disponible maintenant</strong>
        <p>
          Les PDF et TXT sont parses immediatement. Les DOC/DOCX sont stockes et marques pour un
          parsing avance ou IA ulterieur.
        </p>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Importer dans la CVtheque"
        pendingLabel="Import en cours..."
      />
    </form>
  );
}
