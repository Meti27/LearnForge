import { buildCountMap } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface Props {
  sessions: Session[];
}

function getIntensityClass(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "l1";
  if (count === 2) return "l2";
  if (count <= 4)  return "l3";
  return "l4";
}

export default function ActivityHeatmap({ sessions }: Props) {
  const countMap = buildCountMap(sessions);

  // Build last 105 days (15 weeks)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: { key: string; count: number }[] = [];
  for (let i = 104; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, count: countMap[key] ?? 0 });
  }

  const totalActive = Object.values(countMap).filter(v => v > 0).length;

  return (
    <div className="heatmap-section">
      <div className="heatmap-header">
        <span className="heatmap-title">Activity — last 15 weeks</span>
        <span className="heatmap-sub">{totalActive} active days</span>
      </div>
      <div className="heatmap-grid">
        {cells.map(({ key, count }) => (
          <div
            key={key}
            className={`heatmap-cell${count > 0 ? " " + getIntensityClass(count) : ""}`}
            title={count > 0 ? `${key}: ${count} session${count === 1 ? "" : "s"}` : key}
          />
        ))}
      </div>
    </div>
  );
}
