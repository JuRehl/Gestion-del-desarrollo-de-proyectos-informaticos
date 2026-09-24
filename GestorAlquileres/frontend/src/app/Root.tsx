import { Outlet } from "react-router";
import { AddBuildingForm } from "./components/AddBuildingForm";
import { Building2, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "./components/ui/button";

export function Root({ onAddBuilding }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const authToken = localStorage.getItem('auth_token');
  const rawExpiresAt = localStorage.getItem('auth_expires_at');
  const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;
  const isTokenVigente = expiresAt === null || Number.isNaN(expiresAt) || expiresAt > Date.now();
  const isLoggedIn = Boolean(authToken) && isTokenVigente;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires_at');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.rol === 'ADMIN';

    return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Building2 className="size-6" />
            <span>Gestor de Propiedades</span>
          </Link>
          <div className="flex items-center gap-2">
            {!isLoggedIn && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/signup">Registrarse</Link>
                </Button>
              </>
            )}
            {isLoggedIn && (
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="size-4" />
                Cerrar sesion
              </Button>
            )}
            {isHome && isLoggedIn && isAdmin && <AddBuildingForm onAdd={onAddBuilding} />}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
