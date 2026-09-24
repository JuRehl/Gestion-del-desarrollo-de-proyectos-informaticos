import { useState } from 'react';
import { NewExpenseInput } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddExpenseFormProps {
  buildingId: string;
  onAdd: (expense: NewExpenseInput) => Promise<void>;
  triggerButton?: React.ReactNode;
}

export function AddExpenseForm({ buildingId, onAdd, triggerButton }: AddExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.amount) {
      toast.error('Por favor complete tipo y monto');
      return;
    }

    if (!receiptFile) {
      toast.error('Debe subir una foto del comprobante');
      return;
    }

    if (!receiptFile.type.startsWith('image/')) {
      toast.error('El comprobante debe ser una imagen');
      return;
    }

    try {
      setSubmitting(true);
      await onAdd({
        buildingId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        receiptFile,
      });

      setFormData({ type: '', amount: '', description: '' });
      setReceiptFile(null);
      setOpen(false);
      toast.success('Gasto agregado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" />
            Agregar Gasto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            Nuevo Gasto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Gasto</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Limpieza, WiFi, Mantenimiento, etc."
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
              placeholder="5000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Comprobante (foto)</Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Agregar Gasto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
