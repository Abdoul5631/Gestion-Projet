import { useEffect, useState } from "react";
import { filesService } from "../../services/filesService";
import { projectsService } from "../../services/projectsService";

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let size = value;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(1)} ${units[idx]}`;
}

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

export default function FilesPage() {
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [filesData, projectsData] = await Promise.all([
        filesService.list(),
        projectsService.list(),
      ]);
      setRows(filesData?.results || filesData || []);
      const pRows = projectsData?.results || projectsData || [];
      setProjects(pRows);
    } catch (e) {
      setError(readError(e, "Impossible de charger les fichiers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    try {
      await filesService.upload({ project: Number(projectId), file });
      setProjectId("");
      setFile(null);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de l'upload."));
    }
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await filesService.remove(id);
      await loadData();
    } catch (e) {
      setError(readError(e, "Echec de suppression du fichier."));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">Dossiers</h2>

      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default">
        <h3 className="mb-3 text-lg font-medium">Téléverser</h3>
        <form onSubmit={onUpload} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="rounded border px-3 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Projet</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <input
            className="rounded border px-3 py-2"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white">Uploader</button>
        </form>
      </div>

      {loading ? <div className="rounded border border-stroke bg-white p-4">Chargement...</div> : null}
      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

      {!loading ? (
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Taille</th>
                <th className="px-3 py-2 text-left">Date upload</th>
                <th className="px-3 py-2 text-left">Uploader</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2">{String(row.file || "").split("/").pop() || `File #${row.id}`}</td>
                  <td className="px-3 py-2">{formatBytes(row.size)}</td>
                  <td className="px-3 py-2">{row.uploaded_at || row.upload_date || "-"}</td>
                  <td className="px-3 py-2">{row.uploaded_by_username || `#${row.uploaded_by}`}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1"
                        onClick={async () => {
                          setError("");
                          try {
                            await filesService.download(row);
                          } catch (e) {
                            setError(readError(e, "Échec du téléchargement."));
                          }
                        }}
                      >
                        Télécharger
                      </button>
                      <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => onDelete(row.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
