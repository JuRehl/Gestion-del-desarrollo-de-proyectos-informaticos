import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, ShieldAlert, CalendarDays, DollarSign,
  MessageSquare, CheckCircle2, History, ArrowLeft,
  CreditCard, Banknote, Building2, Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type Edificio = {
  id: number;
  nombre: string;
  direccion?: string;
  expensasBase?: number;
  gastosExtra?: number;
  cantidadDepartamentos?: number;
};

type UnidadInquilino = {
  id: number;
  piso?: string;
  nombre?: string;
  edificio?: { id: number };
  inquilino?: {
    id?: number;
    email?: string;
    activo?: boolean;
    fechaFinContrato?: string;
  };
  montoAlquiler?: number;
  porcentajeDepartamento?: number;
};

type GastoComprobante = {
  id: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
  receiptUrl?: string;
  receiptFileName?: string;
};

type DeudaResponse = {
  id: number;
  edificioId?: number;
  tipo: 'ALQUILER' | 'EXPENSAS_BASE' | 'GASTOS_EXTRA' | string;
  periodo: string;
  montoOriginal: number;
  montoPagado: number;
  montoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | string;
  descripcion?: string;
};

type DeudaResumenPorEdificio = {
  ALQUILER: number;
  EXPENSAS_BASE: number;
  GASTOS_EXTRA: number;
  total: number;
};

export default function InquilinoEdificios() {
  const navigate = useNavigate();

  // --- Data ---
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [unidadesPorEdificio, setUnidadesPorEdificio] = useState<Record<number, UnidadInquilino>>({});
  const [deudasPorEdificio, setDeudasPorEdificio] = useState<Record<number, number>>({});
  const [deudasDetallePorEdificio, setDeudasDetallePorEdificio] = useState<Record<number, DeudaResumenPorEdificio>>({});
  const [deudaPendienteTotal, setDeudaPendienteTotal] = useState(0);
  const [comprobantesPorEdificio, setComprobantesPorEdificio] = useState<Record<number, GastoComprobante[]>>({});
  const [mesComprobantes, setMesComprobantes] = useState(new Date().toISOString().slice(0, 7));
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [historialContratos, setHistorialContratos] = useState<any[]>([]);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const [edificioExpandido, setEdificioExpandido] = useState<number | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'TARJETA' | 'EFECTIVO' | null>(null);

  // --- Pago state ---
  const [montoSeleccionTipo, setMontoSeleccionTipo] = useState<'TOTAL' | 'DEUDA' | 'OTRO'>('DEUDA');
  const [montoCustom, setMontoCustom] = useState('');
  const [comentario, setComentario] = useState('');
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: '', nombre: '', vencimiento: '', cvc: '' });
  const [erroresTarjeta, setErroresTarjeta] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [pagoResultado, setPagoResultado] = useState<{ edificioId: number; estado: 'PAGADO' | 'PENDIENTE'; mensaje: string } | null>(null);

  // ─── Fetches ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { navigate("/login"); return; }
      try {
        const authUserRaw = localStorage.getItem("auth_user");
        let authUser: { id?: number; email?: string } | null = null;
        if (authUserRaw) { try { authUser = JSON.parse(authUserRaw); } catch { authUser = null; } }
        const authUserEmail = String(authUser?.email || "").toLowerCase();
        const authUserId = typeof authUser?.id === "number" ? authUser.id : null;

        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { navigate("/login"); return; }
        const data = await res.json();
        setEdificios(data);

        const unidadesRes = await fetch(`${API_BASE}/api/unidades`, { headers: { Authorization: `Bearer ${token}` } });
        if (unidadesRes.ok) {
          const unidades = await unidadesRes.json();
          const delInquilino = (Array.isArray(unidades) ? unidades : []).filter((u: UnidadInquilino) => {
            const emailU = String(u?.inquilino?.email || "").toLowerCase();
            const idU = typeof u?.inquilino?.id === "number" ? u.inquilino.id : null;
            return (authUserEmail && emailU === authUserEmail) || (authUserId !== null && idU === authUserId);
          });
          const porEdificio = delInquilino.reduce((acc: Record<number, UnidadInquilino>, u: UnidadInquilino) => {
            const eid = u?.edificio?.id;
            if (typeof eid === "number" && !acc[eid]) acc[eid] = u;
            return acc;
          }, {});
          setUnidadesPorEdificio(porEdificio);
        }

        const deudasRes = await fetch(`${API_BASE}/api/deudas/mis-deudas`, { headers: { Authorization: `Bearer ${token}` } });
        if (deudasRes.ok) {
          const deudas = (await deudasRes.json()) as DeudaResponse[];
          let totalGral = 0;
          const acumuladas: Record<number, number> = {};
          const detalladas: Record<number, DeudaResumenPorEdificio> = {};

          deudas.forEach((d) => {
            const estado = String(d.estado).toUpperCase();
            if (estado === 'PAGADO' || estado === 'CANCELADA' || !d.edificioId) return;
            const monto = Number(d.montoPendiente) || 0;
            const tipo = String(d.tipo).toUpperCase();
            totalGral += monto;
            acumuladas[d.edificioId] = (acumuladas[d.edificioId] || 0) + monto;
            if (!detalladas[d.edificioId]) detalladas[d.edificioId] = { ALQUILER: 0, EXPENSAS_BASE: 0, GASTOS_EXTRA: 0, total: 0 };
            if (tipo === 'ALQUILER') detalladas[d.edificioId].ALQUILER += monto;
            else if (tipo === 'EXPENSAS_BASE') detalladas[d.edificioId].EXPENSAS_BASE += monto;
            else if (tipo === 'GASTOS_EXTRA') detalladas[d.edificioId].GASTOS_EXTRA += monto;
            detalladas[d.edificioId].total += monto;
          });

          setDeudasPorEdificio(acumuladas);
          setDeudasDetallePorEdificio(detalladas);
          setDeudaPendienteTotal(totalGral);
        }
      } catch { /* silencioso */ } finally { setLoading(false); }
    };
    fetchDatos();
  }, [navigate]);

  useEffect(() => {
    const fetchComprobantes = async () => {
      if (edificios.length === 0) return;
      setCargandoComprobantes(true);
      try {
        const token = localStorage.getItem('auth_token');
        const resultados = await Promise.all(
          edificios.map(async (e) => {
            const params = new URLSearchParams({ edificioId: String(e.id), month: mesComprobantes });
            const res = await fetch(`${API_BASE}/api/gastos?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
            if (!res.ok) return [e.id, []] as const;
            const data = await res.json();
            return [e.id, Array.isArray(data) ? data : []] as const;
          })
        );
        setComprobantesPorEdificio(Object.fromEntries(resultados));
      } catch { setComprobantesPorEdificio({}); } finally { setCargandoComprobantes(false); }
    };
    fetchComprobantes();
  }, [edificios, mesComprobantes]);

  useEffect(() => {
    if (!verHistorial) return;
    const fetchHistorial = async () => {
      const token = localStorage.getItem("auth_token");
      try {
        const [pagosRes, contratosRes] = await Promise.all([
          fetch(`${API_BASE}/api/pagos/mis-pagos`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/pagos/mis-contratos`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (pagosRes.ok) setHistorialPagos(await pagosRes.json());
        if (contratosRes.ok) setHistorialContratos(await contratosRes.json());
      } catch { /* silencioso */ }
    };
    fetchHistorial();
  }, [verHistorial]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const toApiUrl = (path: string) => path.startsWith('http') ? path : `${API_BASE}${path}`;

  const formatearFecha = (fechaISO: string | undefined) => {
    if (!fechaISO) return "Sin fecha";
    const [fecha] = fechaISO.split('T');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const calcularDetallePago = (edificioId: number) => {
    const d = deudasDetallePorEdificio[edificioId] || { ALQUILER: 0, EXPENSAS_BASE: 0, GASTOS_EXTRA: 0, total: 0 };
    return { alquiler: d.ALQUILER, gastoExpensas: d.EXPENSAS_BASE, gastoExtraProrrateado: d.GASTOS_EXTRA, totalPagar: d.total };
  };

  const validarTarjeta = () => {
    const e: Record<string, string> = {};
    setErrorGeneral(null);
    if (!/^\d{16}$/.test(datosTarjeta.numero.replace(/\s/g, ""))) e.numero = "16 dígitos requeridos.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosTarjeta.vencimiento)) {
      e.vencimiento = "Formato MM/AA requerido.";
    } else {
      const [mesStr, anioStr] = datosTarjeta.vencimiento.split('/');
      const hoy = new Date();
      const mesActual = hoy.getMonth() + 1;
      const anioActual = parseInt(hoy.getFullYear().toString().slice(-2));
      if (parseInt(anioStr) < anioActual || (parseInt(anioStr) === anioActual && parseInt(mesStr) < mesActual))
        e.vencimiento = "La tarjeta está vencida.";
    }
    if (!/^\d{3}$/.test(datosTarjeta.cvc)) e.cvc = "3 dígitos requeridos.";
    if (datosTarjeta.nombre.trim().length < 3) e.nombre = "Ingrese el nombre del titular.";
    setErroresTarjeta(e);
    if (Object.keys(e).length > 0) { setErrorGeneral("La tarjeta no es válida. Revisá los campos marcados."); return false; }
    return true;
  };

  const togglePanel = (id: number, metodo: 'TARJETA' | 'EFECTIVO', deudaActual: number) => {
    if (edificioExpandido === id && metodoSeleccionado === metodo) {
      setEdificioExpandido(null); setMetodoSeleccionado(null);
    } else {
      setEdificioExpandido(id); setMetodoSeleccionado(metodo);
      setMontoSeleccionTipo('DEUDA');
      setMontoCustom(deudaActual.toString());
      setComentario('');
      setDatosTarjeta({ numero: '', nombre: '', vencimiento: '', cvc: '' });
      setErroresTarjeta({});
      setErrorGeneral(null);
    }
  };

  const resolverMonto = (edificioId: number) => {
    const detalle = calcularDetallePago(edificioId);
    const deuda = deudasPorEdificio[edificioId] || 0;
    if (montoSeleccionTipo === 'TOTAL') return detalle.totalPagar;
    if (montoSeleccionTipo === 'DEUDA') return deuda;
    return Number(parseFloat(montoCustom) || 0);
  };

  const confirmarPago = async (edificioId: number) => {
    if (!metodoSeleccionado) return;
    if (metodoSeleccionado === 'TARJETA' && !validarTarjeta()) return;

    const monto = resolverMonto(edificioId);
    if (metodoSeleccionado === 'TARJETA' && (isNaN(monto) || monto <= 0)) {
      setErrorGeneral("Ingresá un monto válido."); return;
    }

    setProcesando(true);
    const token = localStorage.getItem("auth_token");
    const nota = metodoSeleccionado === 'EFECTIVO'
      ? (comentario.trim() || "Aviso: Pasaré a pagar en efectivo.")
      : `Pago Online vía Tarjeta: $${monto}`;

    try {
      const res = await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ edificioId, monto, metodo: metodoSeleccionado, nota }),
      });
      if (!res.ok) throw new Error();
      setPagoResultado({
        edificioId,
        estado: metodoSeleccionado === 'TARJETA' ? 'PAGADO' : 'PENDIENTE',
        mensaje: metodoSeleccionado === 'TARJETA' ? '¡Pago con tarjeta registrado exitosamente!' : 'Aviso enviado. Pendiente de confirmación del administrador.',
      });
      setEdificioExpandido(null);
      setDatosTarjeta({ numero: '', nombre: '', vencimiento: '', cvc: '' });
      setComentario('');
    } catch {
      setErrorGeneral("Error de conexión al procesar el pago.");
    } finally {
      setProcesando(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Cargando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {verHistorial ? "Mi Historial" : "Mis Alquileres"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {verHistorial ? "Consulta tus contratos y pagos pasados" : "Gestiona tus unidades actuales y realizá pagos"}
          </p>
        </div>

        {!verHistorial && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deuda pendiente total</p>
            <p className="text-2xl font-black text-slate-900">${deudaPendienteTotal.toLocaleString('es-AR')}</p>
            <p className="text-[11px] font-medium text-slate-500">Incluye pendientes y parciales</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={verHistorial ? "outline" : "default"}
            onClick={() => setVerHistorial(!verHistorial)}
            className="rounded-xl font-bold gap-2 h-11 px-6 shadow-sm"
          >
            {verHistorial ? <><ArrowLeft className="size-4" /> Volver a Alquileres</> : <><History className="size-4" /> Ver Mi Historial</>}
          </Button>

          {!verHistorial && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mes</span>
              <input
                type="month"
                value={mesComprobantes}
                onChange={(ev) => setMesComprobantes(ev.target.value)}
                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-700 cursor-pointer"
              />
            </div>
          )}
        </div>
      </header>

      {/* ── HISTORIAL ── */}
      {verHistorial ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Contratos */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Building2 className="size-5" /></div>
              <h2 className="text-xl font-bold text-gray-800">Historial de Contratos</h2>
            </div>
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      {["Edificio / Unidad", "Monto", "Vencimiento", "Período"].map(h => (
                        <th key={h} className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historialContratos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No hay historial de contratos todavía.</td></tr>
                    ) : historialContratos.map((hc) => (
                      <tr key={hc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-gray-900">{hc.unidad?.edificio?.nombre}</p>
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">{hc.unidad?.piso} {hc.unidad?.nombre}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">${hc.montoAlquiler?.toLocaleString('es-AR')}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-medium bg-white">
                            <Calendar className="size-3 mr-1 text-gray-400" />
                            {hc.vencimientoContrato || "No especificado"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-gray-600 bg-slate-100 inline-flex px-3 py-1 rounded-full">
                            {new Date(hc.fechaInicio).toLocaleDateString('es-AR')} → {hc.fechaFin ? new Date(hc.fechaFin).toLocaleDateString('es-AR') : <span className="text-green-600 ml-1">Vigente</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Pagos */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><CreditCard className="size-5" /></div>
              <h2 className="text-xl font-bold text-gray-800">Historial de Pagos</h2>
            </div>
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      {["Fecha y Edificio", "Monto", "Método", "Estado"].map(h => (
                        <th key={h} className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historialPagos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No se han realizado pagos todavía.</td></tr>
                    ) : historialPagos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.unidad?.edificio?.nombre}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                            {new Date(p.fechaPago).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-lg font-black text-gray-900">${p.monto?.toLocaleString('es-AR')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            {p.metodo === 'TARJETA' ? <CreditCard className="size-4" /> : <Banknote className="size-4" />}
                            <span className="text-xs font-bold">{p.metodo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${p.estado === 'PAGADO' ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-orange-500/10 text-orange-600 border-orange-200'}`} variant="outline">
                            {p.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>

      ) : (
        /* ── EDIFICIOS ── */
        <div className="grid gap-6">
          {edificios.map((e) => {
            const deudaTotal = deudasPorEdificio[e.id] || 0;
            const detalle = calcularDetallePago(e.id);
            const estaAlDia = deudaTotal <= 0;
            const inquilinoInfo = unidadesPorEdificio[e.id]?.inquilino;
            const usuarioActivo = inquilinoInfo?.activo !== false;

            return (
              <div key={e.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${!usuarioActivo ? 'opacity-75 border-red-100 bg-red-50/20' : 'border-gray-200'}`}>

                {/* Fila principal */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{e.nombre}</h2>
                      {usuarioActivo
                        ? <Badge className="bg-green-100 text-green-700 border-green-200 font-bold"><ShieldCheck className="size-3 mr-1" />Activo</Badge>
                        : <Badge variant="destructive" className="gap-1 font-black bg-red-600"><ShieldAlert className="size-3" />Inactivo / Vencido</Badge>
                      }
                    </div>
                    <p className="text-gray-500 text-sm">{e.direccion || "Dirección no disponible"}</p>

                    {!usuarioActivo && (
                      <div className="flex items-center gap-2 mt-3 p-3 bg-red-100/50 rounded-lg text-sm border border-red-200">
                        <CalendarDays className="size-5 text-red-600" />
                        <p className="text-red-700 font-medium">
                          Contrato expirado el <strong>{formatearFecha(inquilinoInfo?.fechaFinContrato)}</strong>
                        </p>
                      </div>
                    )}

                    {/* Desglose deuda */}
                    {!estaAlDia && (
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        <p>Alquiler: <span className="font-bold text-gray-700">${detalle.alquiler.toLocaleString('es-AR')}</span></p>
                        <p>Expensas: <span className="font-bold text-gray-700">${detalle.gastoExpensas.toLocaleString('es-AR')}</span></p>
                        {detalle.gastoExtraProrrateado > 0 && (
                          <p>Gastos extra: <span className="font-bold text-gray-700">${detalle.gastoExtraProrrateado.toLocaleString('es-AR')}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel monto + botones */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[260px] text-center flex flex-col justify-center gap-3">
                    {estaAlDia ? (
                      <div className="py-2 flex flex-col items-center gap-1">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                          <CheckCircle2 className="size-5" />
                          <span className="text-lg font-black uppercase">¡Al día!</span>
                        </div>
                        <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Sin pagos pendientes</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Deuda Pendiente</p>
                          <p className="text-3xl font-black text-slate-900">${deudaTotal.toLocaleString('es-AR')}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Alq ${detalle.alquiler.toLocaleString('es-AR')} + Exp ${detalle.gastoExpensas.toLocaleString('es-AR')} + Extra ${detalle.gastoExtraProrrateado.toLocaleString('es-AR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => togglePanel(e.id, 'TARJETA', deudaTotal)}
                            disabled={!usuarioActivo}
                            className={`flex-1 font-bold text-white ${edificioExpandido === e.id && metodoSeleccionado === 'TARJETA' ? 'bg-blue-800 ring-2 ring-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >💳 Tarjeta</Button>
                          <Button
                            onClick={() => togglePanel(e.id, 'EFECTIVO', deudaTotal)}
                            disabled={!usuarioActivo}
                            className={`flex-1 font-bold text-white ${edificioExpandido === e.id && metodoSeleccionado === 'EFECTIVO' ? 'bg-orange-700 ring-2 ring-orange-200' : 'bg-orange-500 hover:bg-orange-600'}`}
                          >💵 Efectivo</Button>
                        </div>
                        {!usuarioActivo && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Pagos bloqueados</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Comprobantes */}
                <div className="border-t border-gray-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Comprobantes del mes</h3>
                    {cargandoComprobantes && <span className="text-xs text-slate-500">Cargando...</span>}
                  </div>
                  {(comprobantesPorEdificio[e.id] || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No hay comprobantes cargados para este mes.</p>
                  ) : (
                    <div className="space-y-2">
                      {(comprobantesPorEdificio[e.id] || []).map((c) => (
                        <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{c.type}</p>
                            <p className="text-xs text-slate-500">${Number(c.amount || 0).toLocaleString('es-AR')} · {new Date(c.date).toLocaleDateString('es-AR')}</p>
                          </div>
                          {c.receiptUrl && (
                            <a href={toApiUrl(c.receiptUrl)} target="_blank" rel="noreferrer"
                              className="rounded-md bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-700">
                              Ver comprobante
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel de pago desplegable */}
                {edificioExpandido === e.id && (
                  <div className="bg-gray-50 border-t p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="max-w-md mx-auto space-y-4">
                      <h3 className="font-bold text-slate-900 text-center">
                        {metodoSeleccionado === 'TARJETA' ? 'Pago con Tarjeta' : 'Aviso de Pago en Efectivo'}
                      </h3>

                      {/* Selector de monto (solo tarjeta) */}
                      {metodoSeleccionado === 'TARJETA' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-600">Monto a pagar</p>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setMontoSeleccionTipo('DEUDA')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${montoSeleccionTipo === 'DEUDA' ? 'bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                              Deuda (${deudaTotal.toLocaleString('es-AR')})
                            </button>
                            <button type="button" onClick={() => setMontoSeleccionTipo('TOTAL')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${montoSeleccionTipo === 'TOTAL' ? 'bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                              Total (${detalle.totalPagar.toLocaleString('es-AR')})
                            </button>
                            <button type="button" onClick={() => setMontoSeleccionTipo('OTRO')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${montoSeleccionTipo === 'OTRO' ? 'bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                              Otro monto
                            </button>
                          </div>
                          {montoSeleccionTipo === 'OTRO' && (
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                              <Input type="number" step="0.01" min="0" value={montoCustom}
                                onChange={(ev) => setMontoCustom(ev.target.value)}
                                placeholder="0.00" className="pl-9 font-bold" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campos tarjeta */}
                      {metodoSeleccionado === 'TARJETA' && (
                        <div className="space-y-3">
                          <div>
                            <Input placeholder="Número de Tarjeta (16 dígitos)"
                              className={erroresTarjeta.numero ? 'border-red-500' : ''}
                              value={datosTarjeta.numero}
                              onChange={(ev) => setDatosTarjeta({ ...datosTarjeta, numero: ev.target.value })} />
                            {erroresTarjeta.numero && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.numero}</p>}
                          </div>
                          <div>
                            <Input placeholder="Nombre del Titular"
                              className={erroresTarjeta.nombre ? 'border-red-500' : ''}
                              value={datosTarjeta.nombre}
                              onChange={(ev) => setDatosTarjeta({ ...datosTarjeta, nombre: ev.target.value.toUpperCase() })} />
                            {erroresTarjeta.nombre && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.nombre}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Input placeholder="MM/AA"
                                className={erroresTarjeta.vencimiento ? 'border-red-500' : ''}
                                value={datosTarjeta.vencimiento}
                                onChange={(ev) => setDatosTarjeta({ ...datosTarjeta, vencimiento: ev.target.value })} />
                              {erroresTarjeta.vencimiento && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.vencimiento}</p>}
                            </div>
                            <div>
                              <Input placeholder="CVC"
                                className={erroresTarjeta.cvc ? 'border-red-500' : ''}
                                value={datosTarjeta.cvc}
                                onChange={(ev) => setDatosTarjeta({ ...datosTarjeta, cvc: ev.target.value })} />
                              {erroresTarjeta.cvc && <p className="text-red-500 text-[10px] mt-1 font-bold">{erroresTarjeta.cvc}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Campo efectivo */}
                      {metodoSeleccionado === 'EFECTIVO' && (
                        <>
                          <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm font-medium border border-orange-200">
                            El pago quedará <strong>PENDIENTE</strong> hasta que el administrador lo confirme.
                          </div>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-slate-400 size-4" />
                            <Textarea
                              value={comentario}
                              onChange={(ev) => setComentario(ev.target.value)}
                              className="pl-9 min-h-[90px]"
                              placeholder="Ej: Paso mañana a las 18 hs a pagar..."
                            />
                          </div>
                        </>
                      )}

                      {errorGeneral && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100">
                          ⚠️ {errorGeneral}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEdificioExpandido(null)}>Cancelar</Button>
                        <Button
                          className={`flex-1 font-bold text-white ${metodoSeleccionado === 'TARJETA' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`}
                          onClick={() => confirmarPago(e.id)}
                          disabled={procesando || (montoSeleccionTipo === 'OTRO' && Number(parseFloat(montoCustom) || 0) <= 0)}
                        >
                          {procesando ? "Procesando..." : metodoSeleccionado === 'TARJETA' ? "Confirmar Pago" : "Enviar Aviso"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultado pago */}
                {pagoResultado?.edificioId === e.id && (
                  <div className={`border-t px-6 py-4 flex items-center justify-between gap-4 ${pagoResultado.estado === 'PAGADO' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pagoResultado.estado === 'PAGADO' ? '✅' : '⏳'}</span>
                      <div>
                        <p className={`font-extrabold text-sm ${pagoResultado.estado === 'PAGADO' ? 'text-green-800' : 'text-yellow-800'}`}>
                          Estado: {pagoResultado.estado}
                        </p>
                        <p className={`text-xs ${pagoResultado.estado === 'PAGADO' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {pagoResultado.mensaje}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setPagoResultado(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
