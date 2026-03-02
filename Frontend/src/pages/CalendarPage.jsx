import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const STATUS_COLORS = {
  OVERDUE: "#ef4444", // rouge
  IN_PROGRESS: "#3b82f6", // bleu
  DONE: "#22c55e", // vert
};

function getStatusColor(status, dueDate) {
  if (status === "DONE") return STATUS_COLORS.DONE;
  if (dueDate && new Date(dueDate) < new Date() && status !== "DONE") return STATUS_COLORS.OVERDUE;
  return STATUS_COLORS.IN_PROGRESS;
}

export default function CalendarPage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    api.get("calendar/")
      .then((res) => {
        const data = res.data || [];
        const calendarEvents = [];
        data.forEach((item) => {
          if (item.type === "task") {
            calendarEvents.push({
              id: `task-${item.id}`,
              title: item.title,
              start: item.due_date,
              end: item.due_date,
              backgroundColor: getStatusColor(item.status, item.due_date),
              borderColor: getStatusColor(item.status, item.due_date),
              extendedProps: {
                project: item.project_name,
                status: item.status,
              },
            });
          } else if (item.type === "project_start") {
            calendarEvents.push({
              id: `project-start-${item.id}`,
              title: item.title,
              start: item.date,
              end: item.date,
              backgroundColor: "#34d399", // vert pour début projet
              borderColor: "#34d399",
              extendedProps: {
                project: item.project_name,
                status: item.status,
                isProjectStart: true,
              },
            });
          } else if (item.type === "project_end") {
            calendarEvents.push({
              id: `project-end-${item.id}`,
              title: item.title,
              start: item.date,
              end: item.date,
              backgroundColor: "#fbbf24", // jaune pour fin projet
              borderColor: "#fbbf24",
              extendedProps: {
                project: item.project_name,
                status: item.status,
                isProjectEnd: true,
              },
            });
          }
        });
        setEvents(calendarEvents);
      })
      .catch(() => setError("Erreur lors du chargement du calendrier."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Calendrier</h2>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={renderEventContent}
          height="auto"
        />
      )}
      <div className="mt-4 text-sm text-gray-500">
        <span className="inline-block w-3 h-3 mr-1 align-middle" style={{background: STATUS_COLORS.OVERDUE}}></span> En retard
        <span className="inline-block w-3 h-3 mx-2 align-middle" style={{background: STATUS_COLORS.IN_PROGRESS}}></span> En cours
        <span className="inline-block w-3 h-3 mx-2 align-middle" style={{background: STATUS_COLORS.DONE}}></span> Terminé
        <span className="inline-block w-3 h-3 mx-2 align-middle" style={{background: '#34d399'}}></span> Début projet
        <span className="inline-block w-3 h-3 mx-2 align-middle" style={{background: '#fbbf24'}}></span> Fin projet
      </div>
    </div>
  );
}

function renderEventContent(eventInfo) {
  return (
    <div>
      <b>{eventInfo.event.title}</b>
      {eventInfo.event.extendedProps.project && (
        <div className="text-xs text-gray-500">Projet: {eventInfo.event.extendedProps.project}</div>
      )}
      {eventInfo.event.extendedProps.isProjectStart && (
        <div className="text-xs text-yellow-700">Début du projet</div>
      )}
      {eventInfo.event.extendedProps.isProjectEnd && (
        <div className="text-xs text-yellow-800">Fin du projet</div>
      )}
    </div>
  );
}
