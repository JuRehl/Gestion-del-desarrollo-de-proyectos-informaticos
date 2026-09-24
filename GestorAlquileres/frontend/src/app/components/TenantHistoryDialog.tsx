import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
// Importamos MessageSquare para el botón de comentarios
import { History, Calendar, DollarSign, Building2, MessageSquare } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface TenantHistoryDialogProps {
  tenantId: number | string;
  tenantName: string;
}

export function TenantHistoryDialog({ tenantId, tenantName }: TenantHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ pagos: any[]; contratos: any[] }>({ pagos: [], contratos: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("auth_token");
          const res = await fetch(`${API_BASE}/api/pagos/inquilino/${tenantId}/historial`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setHistory(await res.json());
          }
        } catch (error) {
          console.error("Error fetching tenant history:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [open, tenantId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="size-4" />
          Ver Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {tenantName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando historial...</div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Building2 className="size-5" />
                Contratos (Alquileres)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Edificio/Unidad</th>
                      <th className="px-4 py-2 text-left">Monto</th>
                      <th className="px-4 py-2 text-left">Periodo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.contratos.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Sin registros.</td></tr>
                    ) : (
                      history.contratos.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-2">
                            {c.unidad?.edificio?.nombre} - {c.unidad?.piso} {c.unidad?.nombre}
                          </td>
                          <td className="px-4 py-2">${c.montoAlquiler.toLocaleString()}</td>
                          <td className="px-4 py-2 text-xs">
                            {new Date(c.fechaInicio).toLocaleDateString()} - {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : 'Actual'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <DollarSign className="size-5" />
                Pagos Realizados
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Monto</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-center">Nota</th> {/* Columna Nota */}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.pagos.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Sin registros.</td></tr>
                    ) : (
                      history.pagos.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2">{new Date(p.fechaPago).toLocaleString()}</td>
                          <td className="px-4 py-2 font-bold">${p.monto.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {/* BOTÓN DINÁMICO DE COMENTARIO */}
                            {p.nota ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => alert(`Mensaje de ${tenantName}:\n\n"${p.nota}"`)}
                                title="Ver nota"
                              >
                                <MessageSquare className="size-4" />
                              </Button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}