import type { JobMatchResult } from "@/lib/matching";

type MatchBreakdownProps = {
  match: JobMatchResult;
  compact?: boolean;
  showNextStep?: boolean;
};

export function MatchBreakdown({
  match,
  compact = false,
  showNextStep = false
}: MatchBreakdownProps) {
  if (match.breakdown.length === 0) {
    return showNextStep ? <p className="form-caption">{match.nextStep}</p> : null;
  }

  return (
    <div>
      <ul className={`dashboard-mini-list${compact ? " dashboard-mini-list--compact" : ""}`}>
        {match.breakdown.map((item) => (
          <li key={item.key}>
            <strong>{item.label} :</strong> {item.value}
          </li>
        ))}
      </ul>
      {showNextStep ? <p className="form-caption">{match.nextStep}</p> : null}
    </div>
  );
}
