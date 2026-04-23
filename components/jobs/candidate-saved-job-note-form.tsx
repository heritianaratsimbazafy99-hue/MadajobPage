"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { updateCandidateSavedJobNoteAction, type JobActionState } from "@/app/actions/job-actions";
import { SubmitButton } from "@/components/jobs/submit-button";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type CandidateSavedJobNoteFormProps = {
  jobId: string;
  initialNote?: string | null;
};

export function CandidateSavedJobNoteForm({
  jobId,
  initialNote = ""
}: CandidateSavedJobNoteFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateCandidateSavedJobNoteAction, initialState);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition, state.status]);

  return (
    <form className="saved-job-note-form" action={formAction}>
      <input type="hidden" name="job_id" value={jobId} />

      <label className="field">
        <span>Note privee</span>
        <textarea
          name="note"
          rows={3}
          maxLength={600}
          defaultValue={initialNote ?? ""}
          placeholder="Pourquoi garder cette offre, point a verifier, question pour l'entretien..."
        />
      </label>

      <div className="saved-job-note-form__footer">
        {state.message ? (
          <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {state.message}
          </p>
        ) : (
          <small>Visible uniquement dans votre espace candidat.</small>
        )}
        <SubmitButton
          className="btn btn-secondary"
          idleLabel="Enregistrer la note"
          pendingLabel="Enregistrement..."
        />
      </div>
    </form>
  );
}
