import { useState } from 'react';
import { Building } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddBuildingFormProps {
  onAdd: (building: Omit<Building, 'id'>) => Promise<void> | void;
}

export function AddBuildingForm({ onAdd }: AddBuildingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    cantidadDepartamentos: '',
    cantidadInquilinos: '',
    expensasBase: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.direccion.trim() ||
      !formData.cantidadDepartamentos.trim() ||
      !formData.cantidadInquilinos.trim() ||
      !formData.expensasBase.trim()
    ) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    try {
      setLoading(true);
      await onAdd({
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        cantidadDepartamentos: Number(formData.cantidadDepartamentos),
        cantidadInquilinos: Number(formData.cantidadInquilinos),
        expensasBase: Number(formData.expensasBase),
      });

      setFormData({
        nombre: '',
        direccion: '',
        cantidadDepartamentos: '',
        cantidadInquilinos: '',
        expensasBase: '',
      });
      setOpen(false);
      toast.success('Edificio agregado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar el edificio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Agregar Edificio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Nuevo Edificio
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Edificio Central"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Av. Corrientes 1234"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cantidadDepartamentos">Cantidad de departamentos</Label>
              <Input
                id="cantidadDepartamentos"
                type="number"
                min="0"
                value={formData.cantidadDepartamentos}
                onChange={(e) => setFormData({ ...formData, cantidadDepartamentos: e.target.value })}
                placeholder="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidadInquilinos">Cantidad de inquilinos</Label>
              <Input
                id="cantidadInquilinos"
                type="number"
                min="0"
                value={formData.cantidadInquilinos}
                onChange={(e) => setFormData({ ...formData, cantidadInquilinos: e.target.value })}
                placeholder="8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expensasBase">Expensas base</Label>
            <Input
              id="expensasBase"
              type="number"
              min="0"
              step="0.01"
              value={formData.expensasBase}
              onChange={(e) => setFormData({ ...formData, expensasBase: e.target.value })}
              placeholder="15000"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar Edificio'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
