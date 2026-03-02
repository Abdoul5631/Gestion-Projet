import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.post("/api/auth/password-reset/", { email });
      setMessage(data?.detail || "Vérifie ta boite mail.");
    } catch {
      setError("Échec de la demande de réinitialisation.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-default">
        <h1 className="text-2xl font-semibold mb-5">Mot de passe oublié</h1>
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <button className="mt-4 w-full rounded bg-primary px-4 py-2 text-white">Envoyer</button>
        <Link to="/login" className="mt-4 inline-block text-sm text-primary">Retour login</Link>
      </form>
    </div>
  );
}
