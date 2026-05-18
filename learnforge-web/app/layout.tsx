import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnForge — AI Flashcard Generator",
  description:
    "Turn any learning page into Anki flashcards and quiz questions using Groq AI. Sign in to sync your study sessions across devices.",
  openGraph: {
    title: "LearnForge — AI Flashcard Generator",
    description: "Turn any learning page into Anki flashcards and quiz questions using Groq AI.",
    siteName: "LearnForge",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme — runs before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('lf-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
