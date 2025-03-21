import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { WorkOrder, INCO_STAGES, ANTI_STAGES, Stage } from '../types';

interface NewIssueFormProps {
  workOrders: WorkOrder[];
  onSubmit: (issue: any) => Promise<void>;
  onClose: () => void;
  location: 'INCO' | 'ANTI';
}

export function NewIssueForm({ workOrders, onSubmit, onClose, location }: NewIssueFormProps) {
  const [formData, setFormData] = useState({
    work_order_id: '',
    title: '',
    notes: '',
    stage: '',
    priority: 'MEDIUM' as const,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.work_order_id) {
        throw new Error('Debe seleccionar una orden de trabajo');
      }

      const workOrder = workOrders.find(wo => wo.id === formData.work_order_id);
      if (!workOrder) {
        throw new Error(`La orden de trabajo seleccionada no está disponible en ${location}`);
      }

      await onSubmit({
        work_order_id: formData.work_order_id,
        title: formData.title,
        notes: formData.notes,
        stage: formData.stage || null,
        priority: formData.priority,
        status: 'OPEN'
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el problema');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const availableStages: Stage[] = location === 'INCO' ? INCO_STAGES : ANTI_STAGES;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="work_order_id" className="block text-sm font-medium text-gray-700 mb-1">
          Orden de Trabajo
        </label>
        <select
          id="work_order_id"
          name="work_order_id"
          required
          value={formData.work_order_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option key="default" value="">Seleccionar OT</option>
          {workOrders.filter(wo => wo.id).map((wo) => (
            <option key={wo.id} value={wo.id}>
              OT {wo.ot} - {wo.client}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
          Etapa Afectada
        </label>
        <select
          id="stage"
          name="stage"
          value={formData.stage}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Sin etapa específica</option>
          {availableStages.map((stage) => (
            <option key={stage.name} value={stage.name}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="Descripción breve del problema"
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder="Notas adicionales sobre el problema (opcional)"
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          Prioridad
        </label>
        <select
          id="priority"
          name="priority"
          required
          value={formData.priority}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {[
            { value: 'LOW', label: 'Baja' },
            { value: 'MEDIUM', label: 'Media' },
            { value: 'HIGH', label: 'Alta' },
            { value: 'CRITICAL', label: 'Crítica' }
          ].map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creando...' : 'Crear Problema'}
        </button>
      </div>
    </form>
  );
}