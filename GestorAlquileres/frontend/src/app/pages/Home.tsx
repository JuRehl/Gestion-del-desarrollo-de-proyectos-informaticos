import { Building } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, MapPin, User, Mail, Home as HomeIcon, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router';
import { DashboardPreview } from '../components/dashboard/DashboardPreview';
import { DashboardOverlay } from '../components/dashboard/DashboardOverlay';

interface HomeProps {
  buildings: Building[];
  loading?: boolean;
}

export function Home({ buildings, loading }: HomeProps) {
  const userStr = localStorage.getItem('auth_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.rol === 'ADMIN';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="mb-2 flex items-center gap-2">
            <Building2 className="size-8" />
            Mis Edificios
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus propiedades, inquilinos y pagos
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Cargando edificios...
          </CardContent>
        </Card>
      ) : buildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="size-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay edificios registrados. Comienza agregando un nuevo edificio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <Link key={building.id} to={`/building/${building.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="size-5" />
                      {building.nombre}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {building.direccion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {building.propietario && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="size-4 text-muted-foreground" />
                        <span>{building.propietario.nombre}</span>
                      </div>
                    )}
                    {building.propietario?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="size-4 text-muted-foreground" />
                        <span>{building.propietario.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <HomeIcon className="size-4 text-muted-foreground" />
                      <span>{building.cantidadDepartamentos ?? 0} departamentos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="size-4 text-muted-foreground" />
                      <span>{building.cantidadInquilinos ?? 0} inquilinos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <span>Expensas base: ${(building.expensasBase ?? 0).toLocaleString()}</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <>
              <DashboardPreview />
              <DashboardOverlay />
            </>
          )}
        </>
      )}
    </div>
  );
}