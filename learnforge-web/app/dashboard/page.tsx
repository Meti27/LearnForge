import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateStreak, calcAccuracy } from "@/lib/utils";
import type { Session } from "@/lib/types";
import StatsGrid from "./components/StatsGrid";
import ActivityHeatmap from "./components/ActivityHeatmap";
import SessionList from "./components/SessionList";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sessions = [] } = await supabase
    .from("sessions")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);

  const typedSessions = (sessions ?? []) as Session[];

  const totalCards   = typedSessions.reduce((s, sess) => s + sess.flashcards.length, 0);
  const totalQuizzes = typedSessions.filter(s => s.quiz_results?.completed).length;
  const streak       = calculateStreak(typedSessions);
  const accuracy     = calcAccuracy(typedSessions);

  return (
    <>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Study Dashboard</h1>
          <p className="dash-subtitle">
            {typedSessions.length === 0
              ? "No sessions yet — install the extension and generate your first flashcards."
              : `${typedSessions.length} session${typedSessions.length === 1 ? "" : "s"} synced`}
          </p>
        </div>
      </div>

      <StatsGrid
        sessionCount={typedSessions.length}
        totalCards={totalCards}
        totalQuizzes={totalQuizzes}
        streak={streak}
        accuracy={accuracy}
      />

      <ActivityHeatmap sessions={typedSessions} />

      <SessionList sessions={typedSessions} userId={user!.id} />
    </>
  );
}
