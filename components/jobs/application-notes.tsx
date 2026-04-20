"use client";

import { useActionState } from "react";

import {
  addInternalNoteAction,
  type ApplicationActionState
} from "@/app/actions/application-actions";
import { SubmitButton } from "@/components/jobs/submit-button";
import { formatDisplayDate } from "@/lib/format";
import type { InternalApplicationNote } from "@/lib/types";

const initialState: ApplicationActionState = {
  status: "idle",
  message: ""
};

type ApplicationNotesProps = {
  applicationId: string;
  notes: InternalApplicationNote[];
};

export function ApplicationNotes({ applicationId, notes }: ApplicationNotesProps) {
  const [state, formAction] = useActionState(addInternalNoteAction, initialState);

  return (
    <div className="application-notes">
      <div className="application-notes__list">
        {notes.length > 0 ? (
          notes.slice(0, 3).map((note) => (
            <article key={note.id} className="document-card">
              <strong>{note.author_name}</strong>
              <p>{note.body}</p>
              <div className="document-meta">
                <span>{formatDisplayDate(note.created_at)}</span>
                {note.author_email ? <span>{note.author_email}</span> : null}
              </div>
            </article>
          ))
        ) : (
          <p className="form-caption">Aucune note interne pour cette candidature.</p>
        )}
      </div>

      <form action={formAction} className="status-form">
        <input type="hidden" name="application_id" value={applicationId} />
        <label className="field">
          <span>Ajouter une note interne</span>
          <textarea
            name="body"
            rows={3}
            placeholder="Ex. candidat a relancer mardi, bon fit sur la partie commerciale..."
          />
        </label>

        {state.message ? (
          <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {state.message}
          </p>
        ) : null}

        <SubmitButton
          className="btn btn-secondary btn-block"
          idleLabel="Enregistrer la note"
          pendingLabel="Enregistrement..."
        />
      </form>
    </div>
  );
}
