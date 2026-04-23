"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleCandidateSavedJobAction } from "@/app/actions/job-actions";

type CandidateSaveJobButtonProps = {
  jobId: string;
  initialSaved: boolean;
  compact?: boolean;
};

export function CandidateSaveJobButton({
  jobId,
  initialSaved,
  compact = false
}: CandidateSaveJobButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setMessage("");

    startTransition(() => {
      void toggleCandidateSavedJobAction(jobId, nextSaved).then((result) => {
        if (result.status === "error") {
          setIsSaved(!nextSaved);
          setMessage(result.message);
          return;
        }

        setMessage(result.message);
        router.refresh();
      });
    });
  }

  return (
    <div className={compact ? "save-job-control save-job-control--compact" : "save-job-control"}>
      <button
        type="button"
        className={isSaved ? "btn btn-secondary" : "btn btn-ghost"}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending
          ? "Mise a jour..."
          : isSaved
            ? "Offre sauvegardee"
            : "Sauvegarder"}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
