import React, { createContext, useContext, useMemo, useState } from 'react';
import { Building, Tenant, Expense, Payment } from '../types';
import { dashboardService, DashboardMetrics } from '../services/DashboardService';

interface DashboardContextType {
  metrics: DashboardMetrics;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{
  children: React.ReactNode;
  buildings: Building[];
  tenants: Tenant[];
  expenses: Expense[];
  payments: Payment[];
}> = ({ children, buildings, tenants, expenses, payments }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const user = useMemo(() => {
    const rawAuthUser = localStorage.getItem('auth_user');
    return rawAuthUser ? JSON.parse(rawAuthUser) : null;
  }, []);

  const metrics = useMemo(() => {
    return dashboardService.aggregatePortfolioData(buildings, tenants, expenses, payments, user);
  }, [buildings, tenants, expenses, payments, user]);

  return (
    <DashboardContext.Provider value={{ metrics, isExpanded, setIsExpanded }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
