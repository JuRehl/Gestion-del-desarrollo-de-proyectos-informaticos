import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, KeyRound, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && contrasena.trim().length > 0;
  }, [email, contrasena]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, contrasena }),
      });

      if (!response.ok) {
        throw new Error('Credenciales invalidas');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_expires_at', String(data.expiraEnEpochMs));
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));

      toast.success('Sesion iniciada correctamente');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="size-7" />
              Gestor de Propiedades
            </CardTitle>
            <CardDescription>
              Administra edificios, contratos y pagos en un solo lugar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si todavia no tenes una cuenta, podes registrarte en pocos segundos.
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/signup">Crear cuenta</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="size-5" />
              Iniciar sesion
            </CardTitle>
            <CardDescription>Ingresa con tu email y contrasena</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contrasena</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="********"
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                {loading ? 'Ingresando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
