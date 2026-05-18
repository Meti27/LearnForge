"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session, QuizResults } from "@/lib/types";

interface Props {
  session: Session;
  onClose: (updatedResults?: QuizResults) => void;
}

type Answer = number | null;

export default function QuizModal({ session, onClose }: Props) {
  const [answers, setAnswers]   = useState<Answer[]>(new Array(session.quiz.length).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(new Array(session.quiz.length).fill(false));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]     = useState(false);

  const allAnswered = answers.every(a => a !== null);

  function pick(qIdx: number, optIdx: number) {
    if (revealed[qIdx]) return;
    const next = [...answers];
    next[qIdx] = optIdx;
    setAnswers(next);
    const rev = [...revealed];
    rev[qIdx] = true;
    setRevealed(rev);
  }

  async function handleSubmit() {
    setSaving(true);
    const correct = answers.filter((a, i) => a === session.quiz[i].correct).length;
    const results: QuizResults = {
      completed: true,
      correct,
      total: session.quiz.length,
      takenAt: Date.now(),
    };
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("sessions")
        .update({ quiz_results: results })
        .eq("id", session.id);
    } catch {
      // non-fatal — results still shown
    }
    setSaving(false);
    setSubmitted(true);
    onClose(results);
  }

  const correct = answers.filter((a, i) => a === session.quiz[i].correct).length;
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Quiz — {session.title}</h2>
          <button className="modal-close" onClick={() => onClose()}>✕</button>
        </div>

        <div className="modal-scroll">
          {session.quiz.map((q, qi) => (
            <div key={qi} className="quiz-question-block">
              <div className="quiz-q-num">Q{qi + 1} / {session.quiz.length}</div>
              <div className="quiz-q-text">{q.question}</div>
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  let cls = "quiz-opt";
                  if (revealed[qi]) {
                    if (oi === q.correct) cls += " correct";
                    else if (oi === answers[qi]) cls += " wrong";
                    else cls += " dim";
                  } else if (answers[qi] === oi) {
                    cls += " selected";
                  }
                  return (
                    <button key={oi} className={cls} onClick={() => pick(qi, oi)}>
                      <span className="quiz-opt-letter">{letters[oi]}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          {submitted ? (
            <div className="quiz-result-line">
              {correct}/{session.quiz.length} correct ({Math.round((correct / session.quiz.length) * 100)}%)
            </div>
          ) : (
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
            >
              {saving ? "Saving…" : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
