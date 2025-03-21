import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PlantViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const views = [
  { id: 'table', label: 'Vista de Tabla' },
  { id: 'kanban', label: 'Vista Kanban' }
] as const;

export function PlantViews({ activeView, onViewChange }: PlantViewsProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="border border-gray-200 rounded-full p-0 flex bg-blue-50/50">
        <div className="flex relative">
          {views.map((view, index) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                px-6 py-2 text-sm font-medium transition-all relative
                ${index === 0 ? 'rounded-full' : 'rounded-full'}
                ${activeView === view.id
                  ? 'text-blue-700 z-10'
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <span className={`absolute inset-0 transition-all ${
                activeView === view.id 
                  ? 'bg-white shadow-sm rounded-full border border-blue-100' 
                  : ''
              }`} />
              <span className="relative z-10">
                {view.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => onViewChange('issues')}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
          ${activeView === 'issues'
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <AlertTriangle className="w-4 h-4" />
        Problemas
      </button>
    </div>
  );
}