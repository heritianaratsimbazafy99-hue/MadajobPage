import type { CandidateCvAnalysis } from "@/lib/candidate-cv-analysis";

type CandidateCvAnalysisPanelProps = {
  analysis: CandidateCvAnalysis;
  eyebrow: string;
  title: string;
};

export function CandidateCvAnalysisPanel({
  analysis,
  eyebrow,
  title
}: CandidateCvAnalysisPanelProps) {
  return (
    <div className="dashboard-form">
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="dashboard-card__badges">
          <span className={`tag tag--${analysis.tone}`}>{analysis.label}</span>
          <span className="tag tag--muted">{analysis.score}%</span>
        </div>
      </div>

      <div className="candidate-documents-summary-grid">
        <article className="document-card">
          <strong>Niveau de lecture</strong>
          <p>{analysis.description}</p>
          <small>
            {analysis.topKeywords.length > 0
              ? `Mots clefs saillants : ${analysis.topKeywords.slice(0, 4).join(", ")}.`
              : "Aucun mot clef metier assez fort ne ressort encore du dossier."}
          </small>
        </article>

        <article className="document-card">
          <strong>Points forts detectes</strong>
          {analysis.strengths.length > 0 ? (
            <ul className="dashboard-mini-list dashboard-mini-list--compact">
              {analysis.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Les points forts apparaitront ici quand le dossier gagnera en matiere exploitable.</p>
          )}
        </article>

        <article className="document-card">
          <strong>Points a renforcer</strong>
          {analysis.watchouts.length > 0 ? (
            <ul className="dashboard-mini-list dashboard-mini-list--compact">
              {analysis.watchouts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Aucun angle mort majeur ne ressort pour le moment dans cette lecture simple.</p>
          )}
        </article>
      </div>

      <div className="form-grid">
        <article className="document-card">
          <strong>Lecture rapide</strong>
          <ul className="dashboard-mini-list dashboard-mini-list--compact">
            {analysis.signals.map((signal) => (
              <li key={signal.label}>
                <strong>{signal.label} :</strong> {signal.value}
              </li>
            ))}
          </ul>
        </article>

        <article className="document-card">
          <strong>Actions conseillees</strong>
          <ul className="dashboard-mini-list dashboard-mini-list--compact">
            {analysis.nextActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
