import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmed = window.confirm("Voulez-vous vraiment vous déconnecter ?");
    if (confirmed) {
      logout();
      navigate("/login", { replace: true });
    } else {
      navigate(-1); // Retour à la page précédente
    }
    // eslint-disable-next-line
  }, []);

  return null;
}

