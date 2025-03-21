import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Issue } from '../hooks/useIssues';

export function PriorityBadge({ priority }: { priority: Issue['priority'] }) {
  const colors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };

  const icons = {
    LOW: <Clock className="w-4 h-4" />,
    MEDIUM: <AlertCircle className="w-4 h-4" />,
    HIGH: <AlertTriangle className="w-4 h-4" />,
    CRITICAL: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
      {icons[priority]}
      {priorityLabels[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: Issue['status'] }) {
  const colors = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    OPEN: 'Abierto',
    RESOLVED: 'Resuelto',
  };

  const icons = {
    OPEN: <AlertCircle className="w-4 h-4" />,
    IN_PROGRESS: <Clock className="w-4 h-4" />,
    RESOLVED: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {icons[status]}
      {statusLabels[status]}
    </span>
  );
}