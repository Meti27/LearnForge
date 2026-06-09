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
  const [questions, setQuestions]   = useState(session.quiz);
  const [answers, setAnswers]       = useState<Answer[]>(new Array(session.quiz.length).fill(null));
  const [revealed, setRevealed]     = useState<boolean[]>(new Array(session.quiz.length).fill(false));
  const [submitted, setSubmitted]   = useState(false);
  const [saving, setSaving]         = useState(false);

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

  async function deleteQuestion(qi: number) {
    const newQs       = questions.filter((_, i) => i !== qi);
    const newAnswers  = answers.filter((_, i) => i !== qi);
    const newRevealed = revealed.filter((_, i) => i !== qi);
    setQuestions(newQs);
    setAnswers(newAnswers);
    setRevealed(newRevealed);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("sessions").update({ quiz: newQs }).eq("id", session.id);
    } catch {
      // non-fatal
    }
  }

  async function handleSubmit() {
    setSaving(true);
    const correct = answers.filter((a, i) => a === questions[i].correct).length;
    const results: QuizResults = {
      completed: true,
      correct,
      total: questions.length,
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

  const correct = answers.filter((a, i) => a === questions[i]?.correct).length;
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Quiz — {session.title}</h2>
          <button className="modal-close" onClick={() => onClose()}>✕</button>
        </div>

        <div className="modal-scroll">
          {questions.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--gray-6)" }}>
              No questions left.
            </p>
          ) : (
            questions.map((q, qi) => (
              <div key={qi} className="quiz-question-block">
                <div className="quiz-q-header">
                  <div className="quiz-q-num">Q{qi + 1} / {questions.length}</div>
                  {!submitted && (
                    <button className="btn-remove-item" onClick={() => deleteQuestion(qi)}>
                      Remove question
                    </button>
                  )}
                </div>
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
            ))
          )}
        </div>

        <div className="modal-footer">
          {submitted ? (
            <div className="quiz-result-line">
              {correct}/{questions.length} correct ({Math.round((correct / questions.length) * 100)}%)
            </div>
          ) : (
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!allAnswered || saving || questions.length === 0}
            >
              {saving ? "Saving…" : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
