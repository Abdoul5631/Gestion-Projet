import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
};

// sidebar items organized by role
const sidebarDefinitions = {
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: "[D]", section: "NAVIGATION" },
    { label: "Calendrier", path: "/calendar", icon: "[C]", section: "NAVIGATION" },
    { label: "Users Management", path: "/admin/users", icon: "[U]", section: "NAVIGATION" },
    { label: "Teams Management", path: "/admin/teams", icon: "[TM]", section: "NAVIGATION" },
    { label: "Projects Overview", path: "/admin/projects", icon: "[PO]", section: "NAVIGATION" },
    { label: "Tasks Overview", path: "/admin/tasks", icon: "[TO]", section: "NAVIGATION" },
    { label: "Reports", path: "/reports", icon: "[R]", section: "NAVIGATION" },
    { label: "Files", path: "/files", icon: "[F]", section: "NAVIGATION" },
    { label: "System Stats", path: "/admin/stats", icon: "[SS]", section: "NAVIGATION" },
  ],
  manager: [
    { label: "Dashboard", path: "/dashboard", icon: "[D]", section: "NAVIGATION" },
    { label: "Calendrier", path: "/calendar", icon: "[C]", section: "NAVIGATION" },
    { label: "My Projects", path: "/projects", icon: "[P]", section: "NAVIGATION" },
    { label: "Team", path: "/teams", icon: "[TM]", section: "NAVIGATION" },
    { label: "Tasks", path: "/tasks", icon: "[T]", section: "NAVIGATION" },
    { label: "Reports", path: "/reports", icon: "[R]", section: "NAVIGATION" },
    { label: "Messages", path: "/messages", icon: "[M]", section: "NAVIGATION" },
    { label: "Files", path: "/files", icon: "[F]", section: "NAVIGATION" },
  ],
  member: [
    { label: "Dashboard", path: "/dashboard", icon: "[D]", section: "NAVIGATION" },
    { label: "Calendrier", path: "/calendar", icon: "[C]", section: "NAVIGATION" },
    { label: "My Tasks", path: "/tasks", icon: "[T]", section: "NAVIGATION" },
    { label: "My Projects", path: "/projects", icon: "[P]", section: "NAVIGATION" },
    { label: "Reports", path: "/reports", icon: "[R]", section: "NAVIGATION" },
    { label: "Messages", path: "/messages", icon: "[M]", section: "NAVIGATION" },
    { label: "Files", path: "/files", icon: "[F]", section: "NAVIGATION" },
  ],
};

function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; path: string; icon: string; section: string }>;
}) {
  return (
    <div>
      <h3 className="mb-4 ml-4 text-sm font-medium text-slate-400">{title}</h3>
      <ul className="mb-8 flex flex-col gap-2 px-3">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-md px-4 py-3 font-medium duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-xs opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  console.log("Sidebar render, roleLower=", roleLower);
  const dynamicItems = sidebarDefinitions[roleLower] || sidebarDefinitions.member;

  // add account+auth links after
  const accountItems = [
    { label: "Profile", path: "/profile", icon: "[PR]", section: "ACCOUNT" },
    { label: "Settings", path: "/settings", icon: "[S]", section: "ACCOUNT" },
  ];
  const authItems = [{ label: "Logout", path: "/logout", icon: "[X]", section: "AUTHENTICATION" }];

  const navigationItems = dynamicItems.filter((item) => item.section === "NAVIGATION");

  return (
    <aside
      className={`absolute left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-hidden bg-slate-950 duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-6 py-5 lg:py-6">
        <NavLink to="/" className="text-3xl font-bold tracking-tight text-white">
          Gestion Projet
        </NavLink>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="block text-white lg:hidden"
        >
          X
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto py-6 duration-300 ease-linear">
        <SidebarSection title="NAVIGATION" items={navigationItems} />
        <SidebarSection title="ACCOUNT" items={accountItems} />
        <SidebarSection title="AUTHENTICATION" items={authItems} />
      </div>
    </aside>
  );
}
