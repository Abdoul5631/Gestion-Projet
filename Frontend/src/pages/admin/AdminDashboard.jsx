import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { dashboardService } from "../../services/dashboardService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboard, active] = await Promise.all([
          dashboardService.getStats(),
          api.get("/api/users/", { params: { is_active: true, page: 1 } }),
        ]);
        if (!mounted) return;
        setStats(dashboard);
        setActiveUsers(active?.data?.count || 0);
      } catch {
        if (!mounted) return;
        setError("Impossible de charger les statistiques admin.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    return [
      { label: "Total utilisateurs", value: Number(stats?.total_users || 0) },
      { label: "Total équipes", value: Number(stats?.total_teams || 0) },
      { label: "Total projets", value: Number(stats?.total_projects || 0) },
      { label: "Total tâches", value: Number(stats?.total_tasks || 0) },
      { label: "Tâches en retard", value: Number(stats?.overdue_tasks || 0) },
      { label: "Utilisateurs actifs", value: Number(activeUsers || 0) },
    ];
  }, [stats, activeUsers]);

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">System Stats</h2>
      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className="mt-2 text-3xl font-bold text-slate-700">{card.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
