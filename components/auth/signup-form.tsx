"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "candidat"
          },
          emailRedirectTo
        }
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setStatus(
        "Compte cree. Verifie ta boite mail si la confirmation email est active, puis reconnecte-toi."
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="auth-helper">
        Cette inscription est reservee aux candidats. Les acces recruteur et admin
        seront geres par invitation Madajob.
      </p>

      <label className="field">
        <span>Nom complet</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nom et prenom"
          required
        />
      </label>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@email.com"
          required
        />
      </label>

      <label className="field">
        <span>Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Choisissez un mot de passe"
          required
        />
      </label>

      <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creation..." : "Creer mon compte"}
      </button>

      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
