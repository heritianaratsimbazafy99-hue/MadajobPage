"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

const roleLabels = {
  candidat: "Candidat",
  recruteur: "Recruteur",
  admin: "Admin Madajob"
} as const;

export function LoginForm() {
  const router = useRouter();
  const [roleHint, setRoleHint] = useState<keyof typeof roleLabels>("candidat");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helper = useMemo(() => {
    if (roleHint === "recruteur") {
      return "Accedez a vos offres, a vos candidatures et a votre pipeline de recrutement.";
    }

    if (roleHint === "admin") {
      return "Accedez a la supervision transverse des offres, candidats et utilisateurs.";
    }

    return "Accedez a votre profil, vos CV et le suivi de vos candidatures.";
  }, [roleHint]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("Configure d'abord les variables Supabase dans .env.local.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      router.push("/app");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-role-tabs">
        {(Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map((role) => (
          <button
            key={role}
            type="button"
            className={roleHint === role ? "role-tab role-tab--active" : "role-tab"}
            onClick={() => setRoleHint(role)}
          >
            {roleLabels[role]}
          </button>
        ))}
      </div>

      <p className="auth-helper">{helper}</p>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@entreprise.mg"
          required
        />
      </label>

      <label className="field">
        <span>Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Votre mot de passe"
          required
        />
      </label>

      <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connexion..." : "Se connecter"}
      </button>

      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
