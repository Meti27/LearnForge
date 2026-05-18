"use client";
import { useState } from "react";
import type { Session, QuizResults, CardReview } from "@/lib/types";
import SessionCard from "./SessionCard";
import QuizModal from "./QuizModal";
import FlashcardModal from "./FlashcardModal";

interface Props {
  sessions: Session[];
  userId: string;
}

type ModalState =
  | { type: "quiz";      session: Session }
  | { type: "flashcard"; session: Session }
  | null;

export default function SessionList({ sessions: initialSessions, userId }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<ModalState>(null);

  const filtered = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  function handleQuizClose(session: Session, results?: QuizResults) {
    if (results) {
      setSessions(prev =>
        prev.map(s => s.id === session.id ? { ...s, quiz_results: results } : s)
      );
    }
    setModal(null);
  }

  function handleFlashcardClose(session: Session, reviews?: CardReview[]) {
    if (reviews) {
      setSessions(prev =>
        prev.map(s => s.id === session.id ? { ...s, cards_reviewed: reviews } : s)
      );
    }
    setModal(null);
  }

  if (sessions.length === 0) {
    return (
      <div className="sessions-empty">
        <div className="sessions-empty-icon">📚</div>
        <p>No sessions yet. Install the extension and generate your first flashcards!</p>
      </div>
    );
  }

  return (
    <section className="sessions-section">
      <div className="sessions-header">
        <h2 className="sessions-title">Sessions</h2>
        <input
          type="search"
          className="sessions-search"
          placeholder="Search sessions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="sessions-none">No sessions match &ldquo;{search}&rdquo;</p>
      ) : (
        <div className="sessions-grid">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onQuiz={() => setModal({ type: "quiz", session })}
              onFlashcard={() => setModal({ type: "flashcard", session })}
            />
          ))}
        </div>
      )}

      {modal?.type === "quiz" && (
        <QuizModal
          session={modal.session}
          onClose={results => handleQuizClose(modal.session, results)}
        />
      )}

      {modal?.type === "flashcard" && (
        <FlashcardModal
          session={modal.session}
          onClose={reviews => handleFlashcardClose(modal.session, reviews)}
        />
      )}
    </section>
  );
}
