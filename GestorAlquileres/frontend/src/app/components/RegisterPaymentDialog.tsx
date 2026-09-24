import { useState } from 'react';
import { Payment } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPaymentDialogProps {
  tenantId: string;
  tenantName: string;
  buildingId: string;
  rentAmount: number;
  onRegister: (payment: Omit<Payment, 'id' | 'date'>) => Promise<void>;
  disabled?: boolean; // <--- AGREGADO: Para que TypeScript no tire error
}

export function RegisterPaymentDialog({ 
  tenantId, 
  tenantName,
  buildingId, 
  rentAmount, 
  onRegister,
  disabled // <--- AGREGADO: Recibimos la prop
}: RegisterPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: rentAmount.toString(),
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.month) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        tenantId,
        buildingId,
        amount: parseFloat(formData.amount),
        month: formData.month,
        isPaid: true,
      });

      setOpen(false);
      toast.success('Pago registrado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* AGREGADO: disabled={disabled} para bloquear el botón */}
        <Button size="sm" className="gap-2" disabled={disabled}>
          <DollarSign className="size-4" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Registrar Pago - {tenantName}
          </DialogTitle>
          <DialogDescription>
            Confirmá el pago en efectivo del inquilino. Podés registrar un monto parcial o total.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={rentAmount.toString()}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Pago'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}