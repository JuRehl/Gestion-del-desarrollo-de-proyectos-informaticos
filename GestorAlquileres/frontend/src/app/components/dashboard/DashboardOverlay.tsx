import { useDashboard } from "../../context/DashboardContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { DollarSign, TrendingUp, Users, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Building2, Briefcase } from "lucide-react";

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export function DashboardOverlay() {
  const { metrics, isExpanded, setIsExpanded } = useDashboard();

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[96vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <div className="bg-slate-50/50 p-4 md:p-10 border-b">
          <DialogHeader className="max-w-(--breakpoint-xl) mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="size-6 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">
                Panel de Control Administrativo
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Vista global del rendimiento operativo y financiero de su portafolio inmobiliario.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 md:p-6 space-y-6 bg-white w-full">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard 
                title="Ingresos Totales" 
                value={metrics.totalRevenue} 
                sub="Cobros efectivos acumulados" 
                icon={<ArrowUpRight className="size-4" />}
                trend="+12.5%" 
                color="green" 
              />
              <MetricCard 
                title="Egresos Totales" 
                value={metrics.totalExpenses} 
                sub="Gastos operativos globales" 
                icon={<ArrowDownRight className="size-4" />}
                trend="+3.2%" 
                color="red" 
              />
              <MetricCard 
                title="Ocupación" 
                value={`${metrics.occupancyRate.toFixed(1)}%`} 
                sub={`${metrics.occupiedUnits} de ${metrics.totalUnits} unidades`} 
                icon={<Users className="size-4" />}
                trend="Estable" 
                color="blue" 
              />
              <MetricCard 
                title="Balance Neto" 
                value={metrics.netProfit} 
                sub="Rentabilidad neta actual" 
                icon={<DollarSign className="size-4" />}
                trend="+8.1%" 
                color="purple" 
              />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Cash Flow Chart */}
            <Card className="lg:col-span-3 shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">Evolución de Flujo de Caja</CardTitle>
                  <CardDescription>Comparativa mensual de ingresos vs gastos</CardDescription>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-emerald-500" /> Ingresos</div>
                  <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-rose-500" /> Gastos</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[450px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.monthlyTrends}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        tickFormatter={(value) => `$${value/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Distribution */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">Distribución de Gastos</CardTitle>
                <CardDescription>Principales categorías de egresos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {metrics.expensesByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.expensesByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="amount"
                          nameKey="type"
                        >
                          {metrics.expensesByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          formatter={(value) => `$${Number(value).toLocaleString()}`} 
                        />
                        <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <PieChartIcon className="size-12 opacity-10" />
                      <p className="text-sm">Sin datos de gastos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Occupancy Section */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b px-6 py-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="size-5 text-slate-500" />
                Disponibilidad de Unidades
              </CardTitle>
            </div>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="w-full md:w-1/2 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical"
                      data={[
                        { name: 'Ocupadas', cantidad: metrics.occupiedUnits, fill: '#3b82f6' },
                        { name: 'Disponibles', cantidad: metrics.totalUnits - metrics.occupiedUnits, fill: '#cbd5e1' }
                      ]}
                      margin={{left: 0, right: 40}}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="cantidad" radius={[0, 8, 8, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Nivel de Ocupación Global</span>
                      <span className="text-primary">{metrics.occupancyRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{width: `${metrics.occupancyRate}%`}} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-white shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1">Unidades Totales</p>
                      <p className="text-2xl font-bold">{metrics.totalUnits}</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-white shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1">Vacantes</p>
                      <p className="text-2xl font-bold text-rose-500">{metrics.totalUnits - metrics.occupiedUnits}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ title, value, sub, icon, trend, color }: any) {
    const colorConfigs: any = {
        green: {
            text: "text-emerald-700",
            bg: "bg-emerald-50/50",
            border: "border-emerald-100",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            trendColor: "text-emerald-600"
        },
        red: {
            text: "text-rose-700",
            bg: "bg-rose-50/50",
            border: "border-rose-100",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-600",
            trendColor: "text-rose-600"
        },
        blue: {
            text: "text-blue-700",
            bg: "bg-blue-50/50",
            border: "border-blue-100",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
            trendColor: "text-blue-600"
        },
        purple: {
            text: "text-purple-700",
            bg: "bg-purple-50/50",
            border: "border-purple-100",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600",
            trendColor: "text-purple-600"
        },
    };

    const config = colorConfigs[color];

    return (
        <Card className={`border shadow-sm overflow-hidden transition-all hover:shadow-md ${config.bg} ${config.border}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor}`}>
                        {icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-sm ${config.trendColor}`}>
                        {trend}
                    </span>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
                    <h3 className={`text-2xl font-bold tracking-tight ${config.text}`}>
                        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                        {sub}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
