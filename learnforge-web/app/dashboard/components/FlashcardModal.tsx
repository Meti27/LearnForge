"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session, CardReview } from "@/lib/types";

interface Props {
  session: Session;
  onClose: (newReviews?: CardReview[]) => void;
}

type Rating = "again" | "hard" | "good" | "easy";

const RATINGS: { label: string; value: Rating; cls: string }[] = [
  { label: "Again", value: "again", cls: "rate-again" },
  { label: "Hard",  value: "hard",  cls: "rate-hard"  },
  { label: "Good",  value: "good",  cls: "rate-good"  },
  { label: "Easy",  value: "easy",  cls: "rate-easy"  },
];

export default function FlashcardModal({ session, onClose }: Props) {
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState<CardReview[]>([...session.cards_reviewed]);
  const [done, setDone]       = useState(false);

  const card = session.flashcards[idx];
  const total = session.flashcards.length;

  async function rate(rating: Rating) {
    const review: CardReview = { cardIdx: idx, rating, at: Date.now() };
    const nextReviews = [...reviews, review];
    setReviews(nextReviews);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("sessions")
        .update({ cards_reviewed: nextReviews })
        .eq("id", session.id);
    } catch {
      // non-fatal
    }

    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(reviews); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Flashcards — {session.title}</h2>
          <button className="modal-close" onClick={() => onClose(reviews)}>✕</button>
        </div>

        <div className="modal-scroll">
          {done ? (
            <div className="fc-done">
              <div className="fc-done-icon">🎉</div>
              <div className="fc-done-text">All {total} cards reviewed!</div>
              <button className="btn-submit" onClick={() => onClose(reviews)}>Close</button>
            </div>
          ) : (
            <>
              <div className="fc-progress">{idx + 1} / {total}</div>
              <div
                className={`fc-card${flipped ? " flipped" : ""}`}
                onClick={() => setFlipped(f => !f)}
              >
                <div className="fc-front">
                  <div className="fc-side-label">Front</div>
                  <div className="fc-text">{card.front}</div>
                  <div className="fc-tap-hint">Tap to reveal answer</div>
                </div>
                <div className="fc-back">
                  <div className="fc-side-label">Back</div>
                  <div className="fc-text">{card.back}</div>
                </div>
              </div>

              {flipped && (
                <div className="fc-ratings">
                  {RATINGS.map(r => (
                    <button key={r.value} className={`fc-rate-btn ${r.cls}`} onClick={() => rate(r.value)}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
