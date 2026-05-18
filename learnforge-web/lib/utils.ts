import type { Session } from "./types";

export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map(s => toDateKey(s.timestamp)));
  const today = toDateKey(Date.now());
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Allow no activity today — start counting from yesterday
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);

  while (streak < 366) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function buildCountMap(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    const key = toDateKey(s.timestamp);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function calcAccuracy(sessions: Session[]): number | null {
  const done = sessions.filter(s => s.quiz_results?.completed);
  if (done.length === 0) return null;
  const correct = done.reduce((sum, s) => sum + (s.quiz_results!.correct), 0);
  const total   = done.reduce((sum, s) => sum + (s.quiz_results!.total),   0);
  return total > 0 ? Math.round((correct / total) * 100) : null;
}
