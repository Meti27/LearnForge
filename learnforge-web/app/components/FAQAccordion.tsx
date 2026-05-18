"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "Is this really free? What's the catch?",
    a: "The extension is free. AI generation uses Groq's free tier — which gives you a generous number of requests per day at no cost. You supply your own API key (takes 30 seconds to get at console.groq.com). There's no subscription and no usage limit imposed by LearnForge itself.",
  },
  {
    q: "Does my study material get sent to the internet?",
    a: "The page text is sent to Groq's servers for AI processing. Groq's policy prohibits using API data for training. Your flashcard history and quiz results are stored in our database (Supabase, hosted in the EU) under your account — only you can see your data.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can use the extension without signing in — sessions are stored locally on your device. Sign in with Google to sync your sessions across devices and access the full web dashboard from any browser.",
  },
  {
    q: "What are the system requirements?",
    a: "Just Chrome or Brave browser. There's nothing to install on your computer — the AI runs in Groq's cloud. No GPU, no RAM requirements, no Ollama.",
  },
  {
    q: "What subjects does it work for? Is it only for CS students?",
    a: "Not at all — it works for any text-based learning material. Students have used it for cybersecurity, medicine, law, biology, history, languages, and more. If the page has readable text — paragraphs, definitions, lists — LearnForge can turn it into flashcards. You can add any website from the popup's +Add field.",
  },
  {
    q: "Can I use it without Anki?",
    a: "Yes. If Anki is not running, LearnForge still generates and stores your quiz questions and flashcards. You can study them in the built-in web dashboard or extension popup using the quiz and flashcard review modes. Anki is only needed if you want spaced repetition in the Anki desktop app.",
  },
  {
    q: "How do I add a site that isn't in the list?",
    a: "Click the ⚡ LearnForge icon, find the \"+Add\" input at the bottom of the platform grid, type the domain (for example: udemy.com), and click +Add. It gets saved permanently and will appear in the grid from then on.",
  },
  {
    q: "I'm stuck on the setup. What should I do?",
    a: "The most common issue is forgetting to paste the Groq API key into the extension popup — without it, generation won't start. If Anki cards aren't appearing, make sure Anki is open and AnkiConnect is installed. For anything else, open a GitHub Issue and we'll help you directly.",
  },
];

export default function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="faq">
      {FAQS.map((item, i) => (
        <div key={i} className={`faq-item${openIdx === i ? " open" : ""}`}>
          <button
            className="faq-question"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            {item.q}
            <span className="faq-arrow">▾</span>
          </button>
          <div className="faq-answer">{item.a}</div>
        </div>
      ))}
    </div>
  );
}
