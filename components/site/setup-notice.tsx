type SetupNoticeProps = {
  compact?: boolean;
};

export function SetupNotice({ compact = false }: SetupNoticeProps) {
  return (
    <section className={compact ? "setup-notice setup-notice--compact" : "setup-notice"}>
      <p className="eyebrow">Configuration requise</p>
      <h3>Le projet est pret pour Supabase, il manque seulement les cles d'environnement.</h3>
      <p>
        Renseigne <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> pour activer
        l'authentification, les offres, les candidatures et les dashboards relies a
        la base.
      </p>
    </section>
  );
}
