// Ranked bar list shared by the Leaderboards tab and the Stats report.
// Styles live in AdminDashboard.css (admin-lb-*).

export interface LeaderboardRow {
  rank: number;
  name: string;
  points: number;
}

interface Props {
  rows: LeaderboardRow[];
  // Unit shown after the number, e.g. { one: 'guess', many: 'guesses' }.
  unit?: { one: string; many: string };
  emptyText?: string;
}

export default function LeaderboardList({
  rows,
  unit = { one: 'pt', many: 'pts' },
  emptyText = 'No points scored yet.',
}: Props) {
  if (rows.length === 0) {
    return <p className="admin-empty-roster">{emptyText}</p>;
  }
  const max = Math.max(...rows.map(r => r.points));
  return (
    <ol className="admin-lb-list">
      {rows.map(r => (
        <li key={r.name} className="admin-lb-row">
          <span className={`admin-lb-rank ${r.rank <= 3 ? `admin-lb-rank-${r.rank}` : ''}`}>
            {r.rank}
          </span>
          <span className="admin-lb-main">
            <span className="admin-lb-name">{r.name}</span>
            <span className="admin-lb-bar-track">
              <span
                className={`admin-lb-bar ${r.rank <= 3 ? `admin-lb-bar-${r.rank}` : ''}`}
                style={{ width: `${max > 0 ? Math.max(4, (r.points / max) * 100) : 0}%` }}
              />
            </span>
          </span>
          <span className="admin-lb-points">
            {r.points} {r.points === 1 ? unit.one : unit.many}
          </span>
        </li>
      ))}
    </ol>
  );
}
