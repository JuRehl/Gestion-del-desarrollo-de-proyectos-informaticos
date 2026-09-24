import { useDashboard } from "../../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, Users, DollarSign, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/button";

export function DashboardPreview() {
  const { metrics, setIsExpanded } = useDashboard();

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="size-5 text-primary" />
          Resumen de Portafolio
        </h2>
        <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
          Ver Dashboard Completo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickStat 
          title="Ingresos Totales" 
          value={`$${metrics.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="size-4 text-green-600" />}
          description="Cobros procesados"
        />
        <QuickStat 
          title="Gastos Totales" 
          value={`$${metrics.totalExpenses.toLocaleString()}`} 
          icon={<TrendingUp className="size-4 text-red-600" />}
          description="Egresos registrados"
        />
        <QuickStat 
          title="Ocupación" 
          value={`${metrics.occupancyRate.toFixed(1)}%`} 
          icon={<Users className="size-4 text-blue-600" />}
          description={`${metrics.occupiedUnits} de ${metrics.totalUnits} unidades`}
        />
        <QuickStat 
          title="Beneficio Neto" 
          value={`$${metrics.netProfit.toLocaleString()}`} 
          icon={<DollarSign className="size-4 text-primary" />}
          description="Rentabilidad actual"
        />
      </div>
    </div>
  );
}

function QuickStat({ title, value, icon, description }: any) {
  return (
    <Card className="bg-slate-50/50 border-dashed">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
