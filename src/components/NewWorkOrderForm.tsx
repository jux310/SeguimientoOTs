import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { WorkOrder, TAG_DESCRIPTIONS, CLIENTS } from '../types';

interface NewWorkOrderFormProps {
  onSubmit: (workOrder: WorkOrder) => void;
}

export function NewWorkOrderForm({ onSubmit }: NewWorkOrderFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ot: '',
    client: '',
    tag: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.ot.trim() || !formData.client || !formData.tag) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const newWorkOrder: WorkOrder = {
        ...formData,
        description: TAG_DESCRIPTIONS[formData.tag] || '',
        status: '',
        progress: 0,
        dates: {}
      };

      await onSubmit(newWorkOrder);
      setFormData({ ot: '', client: '', tag: '' });
      setIsOpen(false);
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.message?.includes('work_orders_ot_key')) {
        setError(`La OT ${formData.ot} ya existe en el sistema`);
        return;
      }
      setError('Error al crear la OT. Por favor, intente nuevamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (error) setError(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
      >
        <Plus className="w-4 h-4" />
        Crear Nueva OT
      </button>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Nueva Orden de Trabajo</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ot" className="block text-sm font-medium text-gray-700 mb-1">
              Número OT
            </label>
            <input
              type="text"
              id="ot"
              name="ot"
              required
              value={formData.ot}
              onChange={handleChange}
              placeholder="Ingrese número de OT"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              id="client"
              name="client"
              required
              value={formData.client}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar Cliente</option>
              {CLIENTS.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>
          </div>

          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
              TAG
            </label>
            <div className="grid grid-cols-2 gap-4 items-start">
              <select
                id="tag"
                name="tag"
                required
                value={formData.tag}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar TAG</option>
                {Object.keys(TAG_DESCRIPTIONS).map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <p className="text-gray-600 text-sm py-2">
                {TAG_DESCRIPTIONS[formData.tag] || 'Seleccione un TAG para ver su descripción'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Crear OT
          </button>
        </div>
      </form>
    </div>
  );
}