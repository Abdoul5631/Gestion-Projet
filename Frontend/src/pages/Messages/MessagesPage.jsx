import { useEffect, useMemo, useState } from "react";
import { messagesService } from "../../services/messagesService";
import { usersService } from "../../services/usersService";
import { projectsService } from "../../services/projectsService";
import { useAuth } from "../../context/AuthContext";

const readError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const firstVal = data[firstKey];
  if (Array.isArray(firstVal) && firstVal.length) return `${firstKey}: ${firstVal[0]}`;
  if (typeof firstVal === "string") return `${firstKey}: ${firstVal}`;
  return fallback;
};

export default function MessagesPage() {
  const { role } = useAuth();
  const isAdmin = String(role || "").toLowerCase() === "admin";

  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async (forcedProjectId = projectId) => {
    setLoading(true);
    setError("");
    try {
      const params = forcedProjectId ? { project: forcedProjectId } : undefined;
      const [messagesData, me, projectsData] = await Promise.all([
        messagesService.list(params),
        usersService.me(),
        projectsService.list(),
      ]);
      const pRows = projectsData?.results || projectsData || [];
      setMessages(messagesData?.results || messagesData || []);
      setCurrentUser(me);
      setProjects(pRows);
    } catch (e) {
      setError(readError(e, "Impossible de charger les messages."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at || a.timestamp || 0) - new Date(b.created_at || b.timestamp || 0));
  }, [messages]);

  const onFilter = async (e) => {
    e.preventDefault();
    await loadMessages(projectId);
  };

  const onSend = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { project: Number(projectId), content };
      const created = await messagesService.create(payload);
      setMessages((prev) => [...prev, created]);
      setContent("");
    } catch (e) {
      setError(readError(e, "Echec d'envoi du message."));
    }
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await messagesService.remove(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(readError(e, "Echec de suppression du message."));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Messages</h2>

      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
        <form onSubmit={onFilter} className="flex flex-col md:flex-row gap-3">
          <select
            className="rounded border px-3 py-2 w-full md:w-64"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Projet</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <button className="rounded bg-primary px-4 py-2 text-white">Charger</button>
        </form>
      </div>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
          <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
            {sortedMessages.map((message) => {
              const mine = currentUser && Number(message.sender) === Number(currentUser.id);
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 ${mine ? "bg-primary text-white" : "bg-slate-100 text-slate-800"}`}>
                    <p className="text-xs opacity-80 mb-1">
                      {/* Affichage id et username */}
                      {message.sender ? `Utilisateur #${message.sender}` : ""}
                      {message.sender_username ? ` - ${message.sender_username}` : ""}
                      {" - "}{message.created_at || message.timestamp || ""}
                    </p>
                    <p className="text-sm">{message.content}</p>
                    {(mine || isAdmin) ? (
                      <button className={`mt-2 rounded px-2 py-1 text-xs ${mine ? "bg-white/20" : "bg-rose-600 text-white"}`} onClick={() => onDelete(message.id)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={onSend} className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder="Votre message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <button className="rounded bg-primary px-4 py-2 text-white">Envoyer</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
