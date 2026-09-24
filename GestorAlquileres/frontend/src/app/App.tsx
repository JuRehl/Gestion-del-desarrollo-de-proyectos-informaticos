import { useEffect, useState, useCallback, useMemo } from 'react';
import { RouterProvider } from 'react-router';
import { createRouter } from './routes.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Building, Tenant, Expense, Payment, UserSummary, NewExpenseInput } from './types';
import { Toaster } from './components/ui/sonner';
import { DashboardProvider } from './context/DashboardContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function getAuthUser(): UserSummary | null {
  const rawAuthUser = localStorage.getItem('auth_user');

  if (!rawAuthUser) {
    return null;
  }

  try {
    return JSON.parse(rawAuthUser) as UserSummary;
  } catch {
    return null;
  }
}

export default function App() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

  const user = useMemo(() => getAuthUser(), [isAuthenticated]);
  const isAdmin = user?.rol === 'ADMIN';

  const loadAllTenants = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/unidades`);
      if (response.ok) {
        const units = await response.json();
        const allTenants: Tenant[] = units
          .filter((unit: any) => unit.inquilino)
          .map((unit: any) => ({
            id: String(unit.id),
            userId: unit.inquilino.id,
            buildingId: unit.edificio ? String(unit.edificio.id) : '',
            firstName: unit.inquilino.nombre,
            lastName: '',
            email: unit.inquilino.email,
            phone: '',
            floor: unit.piso || '',
            apartmentNumber: unit.nombre || '',
            contractExpirationDate: unit.vencimientoContrato || '',
            paymentDayOfMonth: unit.diaPago || 10,
            rentAmount: unit.montoAlquiler || 0,
            departmentPercentage: unit.porcentajeDepartamento || 0,
          }));
        setTenants(allTenants);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/gastos`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const allExpenses: Expense[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        buildingId: String(item.buildingId),
        type: item.type,
        amount: item.amount,
        description: item.description || '',
        date: item.date,
        receiptFileName: item.receiptFileName,
        receiptUrl: item.receiptUrl,
      }));
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }, []);

  const loadAllPayments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pagos`);
      if (response.ok) {
        const contratos = await response.json();
        const normalizedPayments: Payment[] = contratos.map((c: any) => {
          const estado = String(c.estado ?? '').toUpperCase();
          const tipoAplicacion = String(c.tipoAplicacion ?? '').toUpperCase();
          const remainingBalance = typeof c.saldoPendienteTotal === 'number' ? c.saldoPendienteTotal : undefined;

          let status: Payment['status'] = 'PENDIENTE';
          if (estado === 'PAGADO' && tipoAplicacion === 'PARCIAL') {
            status = 'PARCIAL';
          } else if (estado === 'PAGADO') {
            status = 'PAGADO';
          }

          return {
            id: String(c.id),
            tenantId: String(c.unidad?.id ?? ''),
            buildingId: String(c.unidad?.edificio?.id ?? ''),
            amount: c.monto,
            month: c.fechaPago ? c.fechaPago.slice(0, 7) : '',
            date: c.fechaPago ?? '',
            isPaid: status === 'PAGADO',
            status,
            remainingBalance,
            applicationDetail: c.detalleAplicacion || undefined,
          };
        });

        setPayments(normalizedPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }, [setPayments]);

  const loadBuildings = useCallback(async (signal?: AbortSignal) => {
    if (!localStorage.getItem('auth_token')) return;
    
    setBuildingsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/edificios`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los edificios');
      }

      const data = await response.json();
      setBuildings(Array.isArray(data) ? data : []);
      
      await Promise.all([loadAllTenants(), loadExpenses()]);
      loadAllPayments();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error(error);
    } finally {
      setBuildingsLoading(false);
    }
  }, [loadAllTenants, loadExpenses, loadAllPayments]);

  useEffect(() => {
    const interval = setInterval(() => {
      const token = !!localStorage.getItem('auth_token');
      setIsAuthenticated((prev) => {
        if (token !== prev) return token;
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const controller = new AbortController();
      loadBuildings(controller.signal);
      return () => controller.abort();
    } else {
      setBuildings([]);
      setTenants([]);
      setExpenses([]);
    }
  }, [isAuthenticated, loadBuildings]);

  const handleAddBuilding = useCallback(async (buildingData: Omit<Building, 'id'>) => {
    const authUser = getAuthUser();

    if (!authUser?.id) {
      throw new Error('Debes iniciar sesion para agregar un edificio');
    }

    const response = await fetch(`${API_BASE}/api/edificios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: buildingData.nombre,
        direccion: buildingData.direccion,
        cantidadDepartamentos: buildingData.cantidadDepartamentos,
        cantidadInquilinos: buildingData.cantidadInquilinos,
        expensasBase: buildingData.expensasBase,
        propietarioId: authUser.id,
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo crear el edificio');
    }

    await response.json();
    await loadBuildings();
  }, [loadBuildings]);

  const handleDeleteBuilding = useCallback(async (buildingId: number) => {
    const response = await fetch(`${API_BASE}/api/edificios/${buildingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el edificio');
    }

    const buildingIdAsString = String(buildingId);
    setBuildings((currentBuildings: Building[]) =>
      currentBuildings.filter((building: Building) => building.id !== buildingId),
    );
    setTenants((currentTenants: Tenant[]) =>
      currentTenants.filter((tenant: Tenant) => tenant.buildingId !== buildingIdAsString),
    );
    setExpenses((currentExpenses: Expense[]) =>
      currentExpenses.filter((expense: Expense) => expense.buildingId !== buildingIdAsString),
    );
    setPayments((currentPayments: Payment[]) =>
      currentPayments.filter((payment: Payment) => payment.buildingId !== buildingIdAsString),
    );

    loadBuildings().catch((error) => {
      console.error(error);
    });
  }, [loadBuildings, setPayments]);

  const handleAddTenant = useCallback(async (tenantData: Omit<Tenant, 'id'>) => {
    const response = await fetch(`${API_BASE}/api/unidades/asignar-por-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        edificioId: Number(tenantData.buildingId),
        piso: tenantData.floor,
        nombre: tenantData.apartmentNumber,
        email: tenantData.email,
        montoAlquiler: tenantData.rentAmount,
        porcentajeDepartamento: tenantData.departmentPercentage,
        diaPago: tenantData.paymentDayOfMonth,
        vencimientoContrato: tenantData.contractExpirationDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo agregar el inquilino');
    }

    await loadBuildings();
  }, [loadBuildings]);

  const handleRemoveTenant = useCallback(async (tenantId: string) => {
    const response = await fetch(`${API_BASE}/api/unidades/${tenantId}/inquilino`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el inquilino');
    }

    await loadBuildings();
  }, [loadBuildings]);

  const handleIncreaseRent = useCallback(async (unitId: string, incrementPercentage: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Debes iniciar sesión para actualizar el alquiler');
    }

    const response = await fetch(`${API_BASE}/api/unidades/${unitId}/alquiler`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ incrementoPorcentaje: incrementPercentage }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('No tenés permisos para actualizar el alquiler');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo actualizar el alquiler');
    }

    await loadBuildings();
  }, [loadBuildings]);

  const handleAddExpense = useCallback(async (expenseData: NewExpenseInput) => {
    const formData = new FormData();
    formData.append('type', expenseData.type);
    formData.append('amount', String(expenseData.amount));
    formData.append('description', expenseData.description || '');
    formData.append('receipt', expenseData.receiptFile);

    const response = await fetch(`${API_BASE}/api/edificios/${expenseData.buildingId}/gastos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo agregar el gasto');
    }

    const createdExpense = await response.json();
    const normalizedExpense: Expense = {
      id: createdExpense.id,
      buildingId: String(createdExpense.buildingId),
      type: createdExpense.type,
      amount: createdExpense.amount,
      description: createdExpense.description || '',
      date: createdExpense.date,
      receiptFileName: createdExpense.receiptFileName,
      receiptUrl: createdExpense.receiptUrl,
    };

    setExpenses((currentExpenses: Expense[]) => [normalizedExpense, ...currentExpenses]);
    await loadBuildings();
  }, [loadBuildings]);

  const handleRenewContract = useCallback(async (unitId: string, nuevoVencimiento: string, nuevoMonto: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Debes iniciar sesión para renovar el contrato');
    }

    const response = await fetch(`${API_BASE}/api/unidades/${unitId}/renovar-contrato`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nuevoVencimiento, nuevoMontoAlquiler: nuevoMonto }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo renovar el contrato');
    }

    await loadBuildings();
  }, [loadBuildings]);

  const handleRegisterPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'date'>) => {
    const pagosRes = await fetch(`${API_BASE}/api/pagos/edificio/${paymentData.buildingId}`);
    if (!pagosRes.ok) {
      throw new Error('No se pudieron obtener los pagos del edificio');
    }
    const pagos = await pagosRes.json();
    const contratoPendiente = pagos.find(
      (p: any) =>
        p.estado === 'PENDIENTE' &&
        String(p.unidad?.id) === paymentData.tenantId,
    );

    if (!contratoPendiente) {
      throw new Error('No se encontró un pago pendiente para este inquilino');
    }

    const confirmRes = await fetch(`${API_BASE}/api/pagos/${contratoPendiente.id}/confirmar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: paymentData.amount }),
    });
    if (!confirmRes.ok) {
      throw new Error('No se pudo confirmar el pago en el servidor');
    }

    await loadAllPayments();
  }, [loadAllPayments]);

  const router = useMemo(() => createRouter({
    buildings,
    buildingsLoading,
    tenants,
    expenses,
    payments,
    onAddBuilding: handleAddBuilding,
    onDeleteBuilding: handleDeleteBuilding,
    onAddTenant: handleAddTenant,
    onRemoveTenant: handleRemoveTenant,
    onAddExpense: handleAddExpense,
    onRegisterPayment: handleRegisterPayment,
    onIncreaseRent: handleIncreaseRent,
    onRenewContract: handleRenewContract,
  }), [
    buildings,
    buildingsLoading,
    tenants,
    expenses,
    payments,
    handleAddBuilding,
    handleDeleteBuilding,
    handleAddTenant,
    handleRemoveTenant,
    handleAddExpense,
    handleRegisterPayment,
    handleIncreaseRent,
    handleRenewContract,
  ]);

  const appContent = (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );

  return isAdmin ? (
    <DashboardProvider 
      buildings={buildings} 
      tenants={tenants} 
      expenses={expenses} 
      payments={payments}
    >
      {appContent}
    </DashboardProvider>
  ) : appContent;
}
