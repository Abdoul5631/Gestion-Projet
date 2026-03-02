import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { ...form, role: form.role === "manager" ? "manager" : "member" };
      await api.post("/api/users/", payload);
      navigate("/login");
    } catch (err) {
      const data = err?.response?.data;
      if (typeof data === "string") {
        setError(data);
      } else if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(String(firstVal || "Échec de l'inscription."));
      } else {
        setError("Échec de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-default">
        <h1 className="text-2xl font-semibold mb-5">Inscription</h1>
        <div className="space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Nom d'utilisateur" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} required />
          <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
          <input className="w-full rounded border px-3 py-2" type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
          <select className="w-full rounded border px-3 py-2" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
            <option value="manager">manager</option>
            <option value="member">member</option>
          </select>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <button disabled={loading} className="mt-4 w-full rounded bg-primary px-4 py-2 text-white">
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
        <Link to="/login" className="mt-4 inline-block text-sm text-primary">Retour login</Link>
      </form>
    </div>
  );
}
