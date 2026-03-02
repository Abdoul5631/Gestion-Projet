import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-default text-center">
        <h1 className="text-2xl font-semibold mb-2">Accès refusé</h1>
        <p className="text-sm text-slate-500 mb-4">
          Vous n'êtes pas autorisé à voir cette page.
        </p>
        <Link to="/" className="text-primary">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
