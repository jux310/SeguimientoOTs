import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, X } from 'lucide-react';

interface HistoryEntry {
  changed_at: string;
  work_order_id: string;
  ot: string;
  field: string;
  old_value: string | null;
  new_value: string;
  email: string;
}

interface ChangeHistoryProps {
  history: HistoryEntry[];
}

function formatDateValue(value: string | null): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch {
    return value;
  }
}

export function ChangeHistory({ history }: ChangeHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Historial de Modificaciones Recientes</h3>
      </div>

      <div className="h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay modificaciones recientes</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((entry, index) => (
                <tr key={index} className="text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                    {format(new Date(entry.changed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {entry.ot}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                    {entry.field}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {entry.old_value && (
                      <span className="text-gray-500 line-through mr-2">{formatDateValue(entry.old_value)}</span>
                    )}
                    <span className="text-gray-900">{formatDateValue(entry.new_value)}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    {entry.email.split('@')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}