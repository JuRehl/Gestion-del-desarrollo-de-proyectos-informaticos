import { useParams, Link } from 'react-router';
import { Building, Tenant, Payment, Expense, NewExpenseInput } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Percent, Receipt, Calendar, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useMemo } from 'react';

interface MonthlyReportProps {
  buildings: Building[];
  tenants: Tenant[];
  payments: Payment[];
  expenses: Expense[];
  buildingsLoading?: boolean;
  onAddExpense: (expense: any) => void;
  userRole?: string;
}

export function MonthlyReport({ 
  buildings, 
  tenants, 
  payments, 
  expenses,
  buildingsLoading,
  onAddExpense,
  userRole = 'ADMIN' 
}: MonthlyReportProps) {
  const toApiUrl = (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`);
  const { id } = useParams();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const building = buildings.find(b => String(b.id) === id);
  const buildingId = building ? String(building.id) : id ?? '';

  const filteredData = useMemo(() => {
    const expensesFiltered = expenses.filter(e => {
      const d = new Date(e.date);
      const yearMatch = d.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === "all" || (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
      return e.buildingId === buildingId && yearMatch && monthMatch;
    });

    const paymentsFiltered = payments.filter(p => {
      const [pYear, pMonth] = p.month.split('-');
      const yearMatch = pYear === selectedYear;
      const monthMatch = selectedMonth === "all" || pMonth === selectedMonth;
      return p.buildingId === buildingId && yearMatch && monthMatch && p.status !== 'PENDIENTE';
    });

    return { expensesFiltered, paymentsFiltered };
  }, [expenses, payments, selectedYear, selectedMonth, buildingId]);

  const { expensesFiltered, paymentsFiltered } = filteredData;

  const totalRentIncome = paymentsFiltered.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expensesFiltered.reduce((sum, e) => sum + e.amount, 0);
  const adminCommission = totalRentIncome * 0.05;
  const ownerResult = totalRentIncome - totalExpenses - adminCommission;

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  const expensesByType = expensesFiltered.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.type);
    if (existing) existing.value += expense.amount;
    else acc.push({ name: expense.type, value: expense.amount });
    return acc;
  }, [] as { name: string; value: number }[]);

  const chartData = useMemo(() => {
    if (selectedMonth === "all") {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months.map((name, i) => {
        const monthStr = (i + 1).toString().padStart(2, '0');
        const mExp = expenses.filter(e => 
          e.buildingId === buildingId && 
          new Date(e.date).getFullYear().toString() === selectedYear && 
          (new Date(e.date).getMonth() + 1).toString().padStart(2, '0') === monthStr
        ).reduce((sum, e) => sum + e.amount, 0);
        return { name, Monto: mExp };
      });
    } else {
      return [
        { name: 'Ingresos', Monto: totalRentIncome },
        { name: 'Gastos', Monto: totalExpenses },
        { name: 'Resultado', Monto: ownerResult },
      ];
    }
  }, [selectedMonth, selectedYear, expenses, totalRentIncome, totalExpenses, ownerResult, buildingId]);

  if (!building && buildingsLoading) return <div className="p-20 text-center">Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header y Filtros */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <Link to={`/building/${id}`}>
                <Button variant="ghost" size="sm" className="gap-2 mb-2">
                    <ArrowLeft className="size-4" /> Volver
                </Button>
            </Link>
            <h1 className="text-2xl font-bold">Reportes del Edificio</h1>
            <p className="text-muted-foreground">{building?.direccion}</p>
        </div>
        
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg shadow-sm border">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-medium outline-none text-sm px-2"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <div className="w-px h-4 bg-slate-200" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium outline-none text-sm px-2"
            >
              <option value="all">Todo el año</option>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
              ))}
            </select>
            {userRole !== 'INQ' && (
              <AddExpenseForm 
                buildingId={buildingId} 
                onAdd={onAddExpense}
                triggerButton={<Button size="sm" className="ml-2 gap-2"><Receipt className="size-4" /> Gasto</Button>}
              />
            )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Ingresos" value={totalRentIncome} icon={<TrendingUp />} color="text-green-600" />
        <MetricCard title="Gastos" value={totalExpenses} icon={<TrendingDown />} color="text-red-600" />
        <MetricCard title="Comisión" value={adminCommission} icon={<Percent />} color="text-orange-600" />
        <MetricCard title="Resultado" value={ownerResult} icon={<DollarSign />} color="text-blue-600" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>Flujo de Caja</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="Monto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribución</CardTitle></CardHeader>
          <CardContent>
            {expensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expensesByType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                    {expensesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sin datos</div>}
          </CardContent>
        </Card>
      </div>

      {/* DETALLE DE MOVIMIENTOS CON COMENTARIOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-slate-400" />
            Detalle de Movimientos y Comentarios
          </CardTitle>
          <CardDescription>Lista completa de gastos y aclaraciones del periodo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesFiltered.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No hay registros para mostrar</p>
          ) : (
            <div className="space-y-4">
              {expensesFiltered.map((exp) => (
                <div key={exp.id} className="p-4 border rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 uppercase tracking-wider">
                            {exp.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(exp.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}
                        </span>
                    </div>
                    {/* El campo de comentarios/descripción */}
                    <p className="text-sm font-medium text-slate-700">
                        {exp.description || "Sin descripción adicional"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                        ${exp.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 w-full ${color.replace('text', 'bg')}`} />
      <CardHeader className="pb-2">
        <CardTitle className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${color}`}>
            {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}