import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const realToken = token || "";
      await api.post("/api/auth/password-reset-confirm/", { uid, token: realToken, password });
      setMessage("Mot de passe réinitialisé.");
    } catch {
      setError("Échec de réinitialisation.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-default">
        <h1 className="text-2xl font-semibold mb-5">Réinitialiser le mot de passe</h1>
        <input className="w-full rounded border px-3 py-2 mb-3" placeholder="UID" value={uid} onChange={(e) => setUid(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <button className="mt-4 w-full rounded bg-primary px-4 py-2 text-white">Confirmer</button>
        <Link to="/login" className="mt-4 inline-block text-sm text-primary">Retour login</Link>
      </form>
    </div>
  );
}
