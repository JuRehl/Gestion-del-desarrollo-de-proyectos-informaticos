import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Building, Tenant, Payment, NewExpenseInput} from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { AddTenantForm } from '../components/AddTenantForm';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { RegisterPaymentDialog } from '../components/RegisterPaymentDialog';
import { IncreaseRentDialog } from '../components/IncreaseRentDialog';
import { RenewContractDialog } from '../components/RenewContractDialog';
import { TenantHistoryDialog } from '../components/TenantHistoryDialog';
import { DebtDistributionSection } from '../components/DebtDistributionSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { 
  ArrowLeft, Building2, MapPin, Home, DollarSign, BarChart3, 
  Phone, Mail, Calendar, CheckCircle2, XCircle, Users, Trash2, 
  Search, ShieldAlert, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface BuildingDetailProps {
  buildings: Building[];
  tenants: Tenant[];
  payments: Payment[];
  buildingsLoading?: boolean;
  onDeleteBuilding: (buildingId: number) => Promise<void>;
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onRemoveTenant: (tenantId: string) => Promise<void>;
  onAddExpense: (expense: NewExpenseInput) => Promise<void>;
  onRegisterPayment: (payment: Omit<Payment, 'id' | 'date'>) => Promise<void>;
  onIncreaseRent: (unitId: string, incrementPercentage: number) => Promise<void>;
  onRenewContract: (unitId: string, nuevoVencimiento: string, nuevoMonto: number) => Promise<void>;
}

type TenantDebtSummary = {
  totalPendiente: number;
};

export function BuildingDetail({ 
  buildings, 
  tenants, 
  payments,
  buildingsLoading,
  onDeleteBuilding,
  onAddTenant,
  onRemoveTenant,
  onAddExpense,
  onRegisterPayment,
  onIncreaseRent,
  onRenewContract,
}: BuildingDetailProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantDebtById, setTenantDebtById] = useState<Record<string, number>>({});
  const { id } = useParams();
  
  const building = buildings.find(b => String(b.id) === id);
  const buildingId = building ? String(building.id) : id ?? '';
  const buildingTenants = useMemo(() => tenants.filter(t => t.buildingId === buildingId), [tenants, buildingId]);
  
  const normalizedTenantSearch = tenantSearch.trim().toLowerCase();
  const filteredTenants = buildingTenants.filter((tenant) => {
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    return fullName.includes(normalizedTenantSearch);
  });

  useEffect(() => {
    const loadTenantDebts = async () => {
      if (!building?.id || buildingTenants.length === 0) {
        setTenantDebtById({});
        return;
      }
      try {
        const results = await Promise.all(
          buildingTenants.map(async (tenant) => {
            const userId = tenant.userId;
            if (!userId) return [tenant.id, 0] as const;
            const response = await fetch(`${API_BASE}/api/deudas/inquilino/${userId}/edificio/${building.id}/total`);
            if (!response.ok) return [tenant.id, 0] as const;
            const data = (await response.json()) as TenantDebtSummary;
            return [tenant.id, Number(data.totalPendiente) || 0] as const;
          }),
        );
        setTenantDebtById(Object.fromEntries(results));
      } catch {
        setTenantDebtById({});
      }
    };
    loadTenantDebts();
  }, [building?.id, buildingTenants, payments]); // Se recarga cuando cambian los pagos

  const handleDeleteBuilding = async () => {
    if (!building || deleting) return;
    try {
      setDeleting(true);
      await onDeleteBuilding(building.id);
      toast.success('Edificio eliminado correctamente');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('No se pudo eliminar el edificio');
      setDeleting(false);
    }
  };

  // --- LÓGICA DE ESTADO ACTUALIZADA ---
  const getCurrentMonthPaymentStatus = (tenantId: string, tenantDebt: number) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Obtenemos todos los pagos confirmados del mes para el historial visual
    const monthlyPayments = payments.filter(
        p => p.tenantId === tenantId && p.month === currentMonth && p.status !== 'PENDIENTE'
    );
    
    const totalPagadoMes = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    let status: 'PAGADO' | 'PARCIAL' | 'PENDIENTE' = 'PENDIENTE';

    // Si la deuda es 0 o menos, está PAGADO
    if (tenantDebt <= 0 && totalPagadoMes > 0) {
        status = 'PAGADO';
    } 
    // Si pagó algo pero todavía tiene deuda, es PARCIAL (Pendiente de completar)
    else if (totalPagadoMes > 0 && tenantDebt > 0) {
        status = 'PARCIAL';
    }
    // Si no pagó nada en el mes
    else {
        status = 'PENDIENTE';
    }

    return { monthlyPayments, status };
  };

  if (!building && buildingsLoading) return <div className="p-10 text-center text-muted-foreground">Cargando edificio...</div>;
  if (!building) return <div className="p-10 text-center text-muted-foreground">Edificio no encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/"><Button variant="ghost" className="gap-2 mb-4"><ArrowLeft className="size-4" />Volver</Button></Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="mb-2 flex items-center gap-2 font-black text-3xl"><Building2 className="size-8" />{building.nombre}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm"><MapPin className="size-4" />{building.direccion}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AddTenantForm buildingId={buildingId} onAdd={onAddTenant} />
            <AddExpenseForm buildingId={buildingId} onAdd={onAddExpense} />
            <Link to={`/building/${buildingId}/report`}><Button className="gap-2 font-bold"><BarChart3 className="size-4" />Reportes</Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 font-bold"><Trash2 className="size-4" />Eliminar Edificio</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará el edificio y todos sus registros asociados.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive" onClick={handleDeleteBuilding}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Departamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{building.cantidadDepartamentos || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Inquilinos</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{building.cantidadInquilinos || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Expensas Base</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">${(building.expensasBase || 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Gastos Extra</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">${(building.gastosExtra || 0).toLocaleString()}</div></CardContent></Card>
      </div>

      {/* Sección de Distribución de Deuda */}
      <div className="mb-8">
        <DebtDistributionSection
          tenants={buildingTenants.map((tenant) => ({
            id: tenant.id,
            name: `${tenant.firstName} ${tenant.lastName}`,
            floor: tenant.floor,
            apartment: tenant.apartmentNumber,
            debt: tenantDebtById[tenant.id] || 0,
          }))}
        />
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-xl font-black">Lista de Inquilinos</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} placeholder="Buscar por nombre o apellido..." className="pl-10 bg-white" />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {filteredTenants.map((tenant) => {
              const tenantDebt = tenantDebtById[tenant.id] || 0;
              const paymentStatus = getCurrentMonthPaymentStatus(tenant.id, tenantDebt);
              
              const hoy = new Date();
              const fechaVencimiento = tenant.contractExpirationDate ? new Date(tenant.contractExpirationDate) : null;
              const usuarioActivo = tenant.activo !== false && (!fechaVencimiento || fechaVencimiento > hoy); 
              
              const isPaid = paymentStatus.status === 'PAGADO';
              const isPartial = paymentStatus.status === 'PARCIAL';

              return (
                <Card key={tenant.id} className={`transition-all ${!usuarioActivo ? 'opacity-70 grayscale-[0.5] bg-slate-50 border-red-200' : 'hover:shadow-md'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-4">
                          <div>
                            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900">
                              {tenant.firstName} {tenant.lastName}
                              
                              {!usuarioActivo ? (
                                <Badge variant="destructive" className="gap-1 font-black bg-red-600">
                                  <ShieldAlert className="size-3" /> Inactivo / Vencido
                                </Badge>
                              ) : (
                                <div className="flex gap-2">
                                    <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 font-bold">
                                    <ShieldCheck className="size-3" /> Activo
                                    </Badge>
                                    {isPaid ? (
                                    <Badge className="gap-1 bg-green-500 font-bold text-white"><CheckCircle2 className="size-3" />Pagado</Badge>
                                    ) : isPartial ? (
                                    <Badge className="gap-1 bg-amber-500 text-white font-bold"><CheckCircle2 className="size-3" />Parcial</Badge>
                                    ) : (
                                    <Badge variant="secondary" className="gap-1 font-bold"><XCircle className="size-3" />Pendiente</Badge>
                                    )}
                                </div>
                              )}
                            </h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Piso {tenant.floor}, Unidad {tenant.apartmentNumber}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600"><Mail className="size-4" /><span>{tenant.email}</span></div>
                          {tenant.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="size-4" /><span>{tenant.phone}</span></div>}
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <DollarSign className="size-4 text-green-600" />
                            <span>
                                Alquiler: <strong>${tenant.rentAmount.toLocaleString()}</strong> | 
                                Deuda: <strong className={tenantDebt > 0 ? 'text-red-600' : 'text-green-600'}>
                                    ${tenantDebt.toLocaleString()}
                                </strong>
                            </span>
                          </div>
                          {tenant.contractExpirationDate && (
                            <div className={`flex items-center gap-2 col-span-2 font-bold ${!usuarioActivo ? 'text-red-600' : 'text-slate-500'}`}>
                              <Calendar className="size-4" />
                              <span>{usuarioActivo ? 'Vencimiento Contrato: ' : 'Contrato expirado el: '} {new Date(tenant.contractExpirationDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <TenantHistoryDialog tenantId={tenant.userId || 0} tenantName={`${tenant.firstName} ${tenant.lastName}`} />
                        <IncreaseRentDialog
                          unitId={tenant.id}
                          tenantName={`${tenant.firstName} ${tenant.lastName}`}
                          currentRentAmount={tenant.rentAmount}
                          onIncrease={onIncreaseRent}
                        />
                        <RenewContractDialog
                          unitId={tenant.id}
                          tenantName={`${tenant.firstName} ${tenant.lastName}`}
                          currentVencimiento={tenant.contractExpirationDate || 'N/A'}
                          currentRentAmount={tenant.rentAmount}
                          onRenew={onRenewContract}
                        />
                        <RegisterPaymentDialog
                          tenantId={tenant.id}
                          tenantName={`${tenant.firstName} ${tenant.lastName}`}
                          buildingId={buildingId}
                          rentAmount={tenant.rentAmount}
                          onRegister={onRegisterPayment}
                          disabled={!usuarioActivo} 
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 font-bold"><Trash2 className="size-4 mr-2" />Quitar Inquilino</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Quitar inquilino?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600" onClick={() => onRemoveTenant(tenant.id)}>Quitar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}