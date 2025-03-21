import React from 'react';
import { X, AlertTriangle, Clock, History } from 'lucide-react';
import { WorkOrder } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useWorkOrderHistory } from '../hooks/useWorkOrderHistory';
import { supabase } from '../lib/supabase';

interface WorkOrderDetailsProps {
  workOrder: WorkOrder;
  onClose: () => void;
  totalDelay: number;
}

export function WorkOrderDetails({ workOrder, onClose, totalDelay }: WorkOrderDetailsProps) {
  const { history, loading } = useWorkOrderHistory(workOrder.id);

  const handlePriorityToggle = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update work order priority
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          priority: !workOrder.priority,
          updated_by: user.id 
        })
        .eq('id', workOrder.id)
        .select()
        .single();

      if (error) throw error;

      // Force reload work orders to update UI
      window.location.reload();
    } catch (error) {
      console.error('Error toggling priority:', error);
      alert('Error al cambiar la prioridad. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[90vh] flex flex-col">
        <div className="flex-1 overflow-y-auto relative">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  OT {workOrder.ot}
                </h2>
                <p className="text-lg text-gray-600 mt-1">{workOrder.client}</p>
                <div className="mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workOrder.priority}
                      onChange={handlePriorityToggle}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Marcar como prioritaria</span>
                  </label>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">TAG</h3>
                  <p className="mt-1 text-lg text-gray-900">{workOrder.tag}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <p className="mt-1 text-lg text-gray-900">{workOrder.status || 'Sin iniciar'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                <p className="mt-1 text-lg text-gray-900">{workOrder.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Avance</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${workOrder.progress}%` }}
                      />
                    </div>
                    <span className="text-lg font-medium text-gray-900">
                      {workOrder.progress}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Retraso Total</h3>
                  <p className="mt-1 text-lg text-gray-900 flex items-center gap-2">
                    {totalDelay > 0 ? (
                      <>
                        <Clock className="w-5 h-5 text-orange-500" />
                        {totalDelay} días
                      </>
                    ) : (
                      'Sin retrasos'
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Fechas Programadas</h3>
                <div className="space-y-2">
                  {Object.entries(workOrder.dates).map(([stage, dateInfo]) => (
                    <div key={stage} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{stage}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${dateInfo.confirmed ? 'text-gray-900' : 'text-blue-600'}`}>
                          {format(new Date(dateInfo.date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                        {dateInfo.confirmed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Confirmada
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 border-t border-gray-200">
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">Historial Completo</h3>
              </div>
            
              <div>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando historial...</p>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay registros históricos</p>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha y Hora
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campo
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {history.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.type === 'date' ? 'Fecha' :
                             entry.type === 'issue' ? 'Problema' :
                             entry.type === 'note' ? 'Nota' :
                             'Estado'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {entry.old_value ? (
                              <span>
                                <span className="text-red-600 line-through mr-2">{entry.old_value}</span>
                                <span className="text-green-600">{entry.new_value}</span>
                              </span>
                            ) : (
                              entry.description
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {entry.user_email?.split('@')[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {workOrder.created_at && workOrder.updated_at && (
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex-shrink-0">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Creada el {format(new Date(workOrder.created_at), 'dd/MM/yyyy', { locale: es })}</span>
              <span>Última actualización: {format(new Date(workOrder.updated_at), 'dd/MM/yyyy', { locale: es })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}