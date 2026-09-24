import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type RolUsuario = 'ADMIN' | 'PROP' | 'INQ';

const CLAVE_SECRETA = 'Admin123!'; 

export function SignUp() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolUsuario>('INQ');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const rawExpiresAt = localStorage.getItem('auth_expires_at');
    const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;
    const isTokenVigente = expiresAt === null || Number.isNaN(expiresAt) || expiresAt > Date.now();

    if (token && isTokenVigente) {
      navigate('/', { replace: true });
    }
  }, [navigate]);


  const [claveSecreta, setClaveSecreta] = useState('');
  const canSubmit = useMemo(() => {
    const baseValido =
      nombre.trim().length >= 3 &&
      email.trim().length > 0 &&
      contrasena.trim().length >= 4;
    if (rol === 'ADMIN' || rol === 'PROP') {
      return baseValido && claveSecreta.trim().length > 0;
    }

    return baseValido;
  }, [nombre, email, contrasena, rol, claveSecreta]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || loading) {
      return;
    }

    if ((rol === 'ADMIN' || rol === 'PROP') && claveSecreta !== CLAVE_SECRETA) {
      toast.error('Clave de acceso incorrecta');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, email, rol, contrasena, claveSecreta }),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear el usuario');
      }

      toast.success('Cuenta creada. Ahora inicia sesion');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="size-7" />
              Crear cuenta
            </CardTitle>
            <CardDescription>
              Configura tu acceso para comenzar a gestionar tus propiedades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Luego podras iniciar sesion y operar sobre las propiedades.</p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/login">Ya tengo cuenta</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              Sign up
            </CardTitle>
            <CardDescription>Completa los datos para registrarte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nombre completo</Label>
                <Input
                  id="signup-name"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Juan Gomez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="juan@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-role">Rol</Label>
                <select
                  id="signup-role"
                  value={rol}
                  onChange={(event) => setRol(event.target.value as RolUsuario)}
                  className="border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="INQ">Inquilino</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Contrasena</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  placeholder="Minimo 4 caracteres"
                  minLength={4}
                  required
                />
              </div>

              {(rol === 'ADMIN' || rol === 'PROP') && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-secret">Clave de acceso</Label>
                    <Input
                      id="signup-secret"
                      type="password"
                      value={claveSecreta}
                      onChange={(event) => setClaveSecreta(event.target.value)}
                      placeholder="Ingresá la clave proporcionada"
                      required
                    />
                  </div>
                )}
              <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
