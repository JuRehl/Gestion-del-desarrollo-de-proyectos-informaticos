import { Building, Tenant, Expense, Payment, UserSummary } from '../types';

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
  monthlyTrends: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
  expensesByType: {
    type: string;
    amount: number;
  }[];
}

class DashboardService {
  public aggregatePortfolioData(
    buildings: Building[],
    tenants: Tenant[],
    expenses: Expense[],
    payments: Payment[],
    user: UserSummary | null
  ): DashboardMetrics {
    // 0. Filter buildings by owner if user is ADMIN
    const isAdmin = user?.rol === 'ADMIN';
    const filteredBuildings = isAdmin && user
      ? buildings.filter(b => b.propietario?.id === user.id)
      : buildings;

    const buildingIds = new Set(filteredBuildings.map(b => String(b.id)));

    // Filter dependent data
    const filteredTenants = tenants.filter(t => buildingIds.has(t.buildingId));
    const filteredExpenses = expenses.filter(e => buildingIds.has(e.buildingId));
    const filteredPayments = payments.filter(p => buildingIds.has(p.buildingId));

    const currentYear = new Date().getFullYear();

    // 1. Calculate Occupancy
    const totalUnits = filteredBuildings.reduce((sum, b) => sum + (b.cantidadDepartamentos || 0), 0);
    const occupiedUnits = filteredTenants.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // 2. Calculate Financials
    const totalRevenue = filteredPayments
      .filter(p => p.status !== 'PENDIENTE')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // 3. Expenses by Type
    const expensesByTypeMap = filteredExpenses.reduce((acc, exp) => {
      acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByType = Object.entries(expensesByTypeMap).map(([type, amount]) => ({
      type,
      amount,
    }));

    // 4. Monthly Trends
    const monthlyTrends = this.calculateMonthlyTrends(filteredPayments, filteredExpenses, currentYear);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      occupancyRate,
      totalUnits,
      occupiedUnits,
      monthlyTrends,
      expensesByType,
    };
  }
// ...

  private calculateMonthlyTrends(payments: Payment[], expenses: Expense[], year: number) {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return months.map((name, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      
      const monthlyRevenue = payments
        .filter(p => p.status !== 'PENDIENTE' && p.month === `${year}-${monthStr}`)
        .reduce((sum, p) => sum + p.amount, 0);

      const monthlyExpenses = expenses
        .filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === year && (d.getMonth() + 1).toString().padStart(2, '0') === monthStr;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: name,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
      };
    });
  }
}

export const dashboardService = new DashboardService();
