import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { DollarSign, CheckCircle2, AlertCircle, TrendingUp, ChevronDown } from 'lucide-react';

interface TenantDebtData {
  id: string;
  name: string;
  floor: string;
  apartment: string;
  debt: number;
}

interface DebtDistributionSectionProps {
  tenants: TenantDebtData[];
}

export function DebtDistributionSection({ tenants }: DebtDistributionSectionProps) {
  const [openDebt, setOpenDebt] = useState(false);

  const analysis = useMemo(() => {
    const tenantsWithDebt = tenants.filter(t => t.debt > 0);
    const tenantsNoDuty = tenants.filter(t => t.debt === 0);
    const totalDebt = tenantsWithDebt.reduce((sum, t) => sum + t.debt, 0);

    return {
      tenantsWithDebt: tenantsWithDebt.sort((a, b) => b.debt - a.debt),
      tenantsNoDuty,
      totalDebt,
      totalTenants: tenants.length,
      debtorCount: tenantsWithDebt.length,
      paidCount: tenantsNoDuty.length,
    };
  }, [tenants]);

  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-amber-600',
    'bg-rose-500',
    'bg-pink-500',
  ];

  // Estado vacío
  if (analysis.totalTenants === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 font-bold">
            <TrendingUp className="size-4 text-blue-600" />
            Distribución de Deuda Entre Inquilinos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="size-8 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No hay inquilinos registrados</p>
        </CardContent>
      </Card>
    );
  }

  // Sin deudas
  if (analysis.totalDebt === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 font-bold">
            <TrendingUp className="size-4 text-green-600" />
            Distribución de Deuda Entre Inquilinos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle2 className="size-8 mx-auto text-green-600 mb-2" />
          <p className="text-sm font-semibold text-green-700">¡Excelente! No hay deudas pendientes</p>
          <p className="text-xs text-green-600 mt-1">Todos los inquilinos están al día</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Deuda Total</p>
                <p className="text-2xl font-black text-red-600 mt-1">
                  ${analysis.totalDebt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="size-8 text-red-300 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Con Deuda</p>
                <p className="text-2xl font-black text-orange-600 mt-1">{analysis.debtorCount}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {analysis.debtorCount === 1 ? 'inquilino' : 'inquilinos'}
                </p>
              </div>
              <AlertCircle className="size-8 text-orange-300 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Al Día</p>
                <p className="text-2xl font-black text-green-600 mt-1">{analysis.paidCount}</p>
                <p className="text-xs text-green-600 mt-1">
                  {analysis.paidCount === 1 ? 'inquilino' : 'inquilinos'}
                </p>
              </div>
              <CheckCircle2 className="size-8 text-green-300 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico - Collapsible */}
      <Collapsible open={openDebt} onOpenChange={setOpenDebt}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm flex items-center gap-2 font-bold">
                  <TrendingUp className="size-4 text-slate-600" />
                  Inquilinos con Deuda ({analysis.debtorCount})
                </CardTitle>
                <ChevronDown 
                  className={`size-5 text-slate-600 transition-transform duration-200 ${openDebt ? 'rotate-180' : ''}`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {analysis.tenantsWithDebt.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay deudas pendientes</p>
              ) : (
                <div className="space-y-4">
                  {analysis.tenantsWithDebt.map((tenant, index) => {
                    const percentage = (tenant.debt / analysis.totalDebt) * 100;
                    const colorClass = colors[index % colors.length];

                    return (
                      <div key={tenant.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">
                              {tenant.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Piso {tenant.floor}, Unidad {tenant.apartment}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm text-red-600">
                              ${tenant.debt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colorClass} transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Inquilinos al día */}
      {analysis.paidCount > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 font-bold text-green-700">
              <CheckCircle2 className="size-4" />
              Inquilinos al Día ({analysis.paidCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {analysis.tenantsNoDuty.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200"
                >
                  <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Unidad {tenant.apartment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
