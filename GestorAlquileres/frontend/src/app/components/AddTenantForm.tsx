import { useState } from 'react';
import { Tenant } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AddTenantFormProps {
  buildingId: string;
  onAdd: (tenant: Omit<Tenant, 'id'>) => void;
}

export function AddTenantForm({ buildingId, onAdd }: AddTenantFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    floor: '',
    apartmentNumber: '',
    contractExpirationDate: '',
    paymentDayOfMonth: '',
    rentAmount: '',
    departmentPercentage: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.rentAmount || !formData.departmentPercentage) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        buildingId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        floor: formData.floor,
        apartmentNumber: formData.apartmentNumber,
        contractExpirationDate: formData.contractExpirationDate,
        paymentDayOfMonth: parseInt(formData.paymentDayOfMonth) || 10,
        rentAmount: parseFloat(formData.rentAmount),
        departmentPercentage: parseFloat(formData.departmentPercentage),
      });

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        floor: '',
        apartmentNumber: '',
        contractExpirationDate: '',
        paymentDayOfMonth: '',
        rentAmount: '',
        departmentPercentage: '',
      });
      setOpen(false);
      toast.success('Inquilino agregado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar inquilino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="size-4" />
          Agregar Inquilino
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Nuevo Inquilino
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan.perez@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Piso</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartmentNumber">Número</Label>
              <Input
                id="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
                placeholder="A"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rentAmount">Monto de Alquiler *</Label>
            <Input
              id="rentAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.rentAmount}
              onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentPercentage">Porcentaje del Departamento (%) *</Label>
            <Input
              id="departmentPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.departmentPercentage}
              onChange={(e) => setFormData({ ...formData, departmentPercentage: e.target.value })}
              placeholder="25"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentDayOfMonth">Día de pago del mes</Label>
            <Input
              id="paymentDayOfMonth"
              type="number"
              min="1"
              max="31"
              value={formData.paymentDayOfMonth}
              onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: e.target.value })}
              placeholder="10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contractExpirationDate">Vencimiento del Contrato</Label>
            <Input
              id="contractExpirationDate"
              type="date"
              value={formData.contractExpirationDate}
              onChange={(e) => setFormData({ ...formData, contractExpirationDate: e.target.value })}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar Inquilino'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
