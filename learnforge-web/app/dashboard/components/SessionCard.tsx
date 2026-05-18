import { formatRelativeTime } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface Props {
  session:    Session;
  onQuiz:     () => void;
  onFlashcard: () => void;
}

export default function SessionCard({ session, onQuiz, onFlashcard }: Props) {
  const quizDone     = session.quiz_results?.completed;
  const accuracy     = quizDone
    ? Math.round((session.quiz_results!.correct / session.quiz_results!.total) * 100)
    : null;
  const reviewedCount = session.cards_reviewed.length;

  return (
    <div className="session-card">
      <div className="session-card-top">
        <div className="session-domain">{session.domain}</div>
        <div className="session-time">{formatRelativeTime(session.timestamp)}</div>
      </div>
      <div className="session-title">{session.title}</div>
      <div className="session-meta">
        <span className="session-badge">{session.quiz.length} questions</span>
        <span className="session-badge">{session.flashcards.length} cards</span>
        {session.added_to_anki > 0 && (
          <span className="session-badge badge-anki">{session.added_to_anki} → Anki</span>
        )}
        {quizDone && accuracy !== null && (
          <span className={`session-badge badge-accuracy ${accuracy >= 70 ? "good" : "low"}`}>
            {accuracy}% accuracy
          </span>
        )}
        {reviewedCount > 0 && (
          <span className="session-badge badge-reviewed">{reviewedCount} reviewed</span>
        )}
      </div>
      <div className="session-actions">
        <button
          className="btn-session"
          onClick={onQuiz}
          disabled={session.quiz.length === 0}
        >
          📝 {quizDone ? "Retake Quiz" : "Take Quiz"}
        </button>
        <button
          className="btn-session"
          onClick={onFlashcard}
          disabled={session.flashcards.length === 0}
        >
          🎴 Flashcards
        </button>
      </div>
    </div>
  );
}
