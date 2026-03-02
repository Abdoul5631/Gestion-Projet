import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoading, authError, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const me = await login(username, password);
    if (me) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-default">
        <h1 className="text-2xl font-semibold mb-1">Gestion de Projet</h1>
        <p className="text-sm text-slate-500 mb-5">Connexion</p>

        <div className="space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="w-full rounded border px-3 py-2" placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {authError ? <p className="mt-3 text-sm text-rose-600">{typeof authError === "string" ? authError : "Erreur de connexion"}</p> : null}

        <button disabled={isLoading} className="mt-4 w-full rounded bg-primary px-4 py-2 text-white">
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/register" className="text-primary">Créer un compte</Link>
          <Link to="/forgot-password" className="text-primary">Mot de passe oublié</Link>
        </div>
      </form>
    </div>
  );
}
