export interface Session {
  id: string;
  user_id: string;
  title: string;
  url: string;
  domain: string;
  deck: string;
  timestamp: number;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  quiz_results: QuizResults | null;
  cards_reviewed: CardReview[];
  added_to_anki: number;
  synced_at: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  _from?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  _from?: string;
}

export interface QuizResults {
  completed: boolean;
  correct: number;
  total: number;
  takenAt: number;
}

export interface CardReview {
  cardIdx: number;
  rating: "again" | "hard" | "good" | "easy";
  at: number;
}
