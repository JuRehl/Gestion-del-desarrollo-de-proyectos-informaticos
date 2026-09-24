import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface IncreaseRentDialogProps {
  unitId: string;
  tenantName: string;
  currentRentAmount: number;
  onIncrease: (unitId: string, incrementPercentage: number) => Promise<void>;
}

export function IncreaseRentDialog({
  unitId,
  tenantName,
  currentRentAmount,
  onIncrease,
}: IncreaseRentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [increasePercentage, setIncreasePercentage] = useState('');

  const parsedPercentage = Number(increasePercentage);
  const previewAmount = useMemo(() => {
    if (!Number.isFinite(parsedPercentage) || parsedPercentage <= 0) {
      return currentRentAmount;
    }

    return Math.round(currentRentAmount * (1 + parsedPercentage / 100) * 100) / 100;
  }, [currentRentAmount, parsedPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!increasePercentage || parsedPercentage <= 0) {
      toast.error('Ingresá un porcentaje válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await onIncrease(unitId, parsedPercentage);
      setIncreasePercentage('');
      setOpen(false);
      toast.success('Alquiler actualizado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el alquiler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <TrendingUp className="size-4" />
          Aumentar alquiler
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Aumentar alquiler - {tenantName}
          </DialogTitle>
          <DialogDescription>
            Ajustá el alquiler actual de la unidad con un incremento porcentual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Alquiler actual</span>
              <strong>${currentRentAmount.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Nuevo alquiler estimado</span>
              <strong className="text-green-700">${previewAmount.toLocaleString()}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="increasePercentage">Incremento (%)</Label>
            <Input
              id="increasePercentage"
              type="number"
              min="0.01"
              step="0.01"
              value={increasePercentage}
              onChange={(e) => setIncreasePercentage(e.target.value)}
              placeholder="10"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Actualizando...' : 'Confirmar aumento'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}