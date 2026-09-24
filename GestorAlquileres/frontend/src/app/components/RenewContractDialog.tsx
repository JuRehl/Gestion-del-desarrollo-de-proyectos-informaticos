import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RenewContractDialogProps {
  unitId: string;
  tenantName: string;
  currentVencimiento: string;
  currentRentAmount: number;
  onRenew: (unitId: string, nuevoVencimiento: string, nuevoMonto: number) => Promise<void>;
}

export function RenewContractDialog({
  unitId,
  tenantName,
  currentVencimiento,
  currentRentAmount,
  onRenew,
}: RenewContractDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nuevoVencimiento, setNuevoVencimiento] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState(String(currentRentAmount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoVencimiento || !nuevoMonto || Number(nuevoMonto) <= 0) {
      toast.error('Por favor, ingresá una fecha y un monto válidos');
      return;
    }

    setLoading(true);
    try {
      await onRenew(unitId, nuevoVencimiento, Number(nuevoMonto));
      setOpen(false);
      toast.success('Contrato renovado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo renovar el contrato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Renovar contrato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5" />
            Renovar contrato - {tenantName}
          </DialogTitle>
          <DialogDescription>
            Extendé el vencimiento del contrato y actualizá el monto del alquiler.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Vencimiento actual: {currentVencimiento}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevoVencimiento">Nuevo vencimiento</Label>
            <Input
              id="nuevoVencimiento"
              type="date"
              value={nuevoVencimiento}
              onChange={(e) => setNuevoVencimiento(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevoMonto">Nuevo monto alquiler</Label>
            <Input
              id="nuevoMonto"
              type="number"
              min="1"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Renovando...' : 'Confirmar renovación'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
