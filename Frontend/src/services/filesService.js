import api from "../api/axios";

export const filesService = {
  async list(params) {
    const { data } = await api.get("/api/files/", { params });
    return data;
  },

  async upload({ project, file }) {
    const formData = new FormData();
    formData.append("project", project);
    formData.append("file", file);
    const { data } = await api.post("/api/files/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async remove(id) {
    await api.delete(`/api/files/${id}/`);
  },

  async download(fileRow) {
    if (!fileRow || !fileRow.id) return;
    // try to retrieve blob via protected endpoint so we can handle errors
    const url = `/api/project-files/${fileRow.id}/download/`;
    const response = await api.get(url, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    const filename = fileRow.file ? String(fileRow.file).split("/").pop() : `file_${fileRow.id}`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
