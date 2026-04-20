"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { applyToJobAction, type JobActionState } from "@/app/actions/job-actions";
import { SubmitButton } from "@/components/jobs/submit-button";

const initialState: JobActionState = {
  status: "idle",
  message: ""
};

type JobApplyFormProps = {
  jobId: string;
  jobSlug: string;
  primaryCvName?: string | null;
};

export function JobApplyForm({ jobId, jobSlug, primaryCvName = null }: JobApplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction] = useActionState(applyToJobAction, initialState);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition, state.status]);

  return (
    <form ref={formRef} action={formAction} className="dashboard-form">
      <input type="hidden" name="job_post_id" value={jobId} />
      <input type="hidden" name="job_slug" value={jobSlug} />

      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Candidature native</p>
          <h2>Postuler depuis la plateforme</h2>
        </div>
      </div>

      <p className="form-caption">
        {primaryCvName
          ? `Votre CV principal actuel (${primaryCvName}) sera rattache automatiquement a cette candidature.`
          : "Vous pouvez candidater maintenant, puis ajouter votre CV principal depuis votre espace candidat pour les prochains envois."}
      </p>

      <label className="field">
        <span>Message de candidature</span>
        <textarea
          name="cover_letter"
          rows={6}
          placeholder="Ajoutez quelques lignes pour contextualiser votre candidature."
        />
      </label>

      {state.message ? (
        <p className={state.status === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="btn btn-primary btn-block"
        idleLabel="Envoyer ma candidature"
        pendingLabel="Envoi en cours..."
      />
    </form>
  );
}
