interface Props {
  sessionCount: number;
  totalCards:   number;
  totalQuizzes: number;
  streak:       number;
  accuracy:     number | null;
}

export default function StatsGrid({ sessionCount, totalCards, totalQuizzes, streak, accuracy }: Props) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-num">{sessionCount}</div>
        <div className="stat-label">Sessions</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{totalCards}</div>
        <div className="stat-label">Flashcards</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{totalQuizzes}</div>
        <div className="stat-label">Quizzes done</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{streak}</div>
        <div className="stat-label">Day streak</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{accuracy !== null ? `${accuracy}%` : "—"}</div>
        <div className="stat-label">Quiz accuracy</div>
      </div>
    </div>
  );
}
