import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import ThemeToggle from "@/app/components/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <a href="/" className="dash-logo">
          <div className="dash-logo-icon">⚡</div>
          <span>LearnForge</span>
        </a>
        <nav className="dash-nav">
          <a href="/dashboard" className="dash-nav-link active">📊 Dashboard</a>
          <a href="/account" className="dash-nav-link">👤 Account</a>
        </nav>
        <div className="dash-sidebar-footer">
          <div className="dash-user-email">{user.email}</div>
          <div style={{ marginTop: "10px" }}>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="dash-main">
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
}
