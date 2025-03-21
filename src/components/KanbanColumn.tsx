import React from 'react';
import { WorkOrder, Stage } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  stage: Stage;
  workOrders: WorkOrder[];
  onDateChange: (ot: string, stage: string, date: string, confirmed: boolean) => void;
  stages: Stage[];
}

export function KanbanColumn({ stage, workOrders, onDateChange, stages }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-48 bg-gray-50 rounded-lg p-2">
      <h3 className="font-medium text-gray-900 mb-2">
        {stage.name}
        <span className="ml-2 text-sm text-gray-500">
          ({workOrders.length})
        </span>
      </h3>
      <div className="space-y-1.5">
        {workOrders.map((workOrder) => (
          <KanbanCard
            key={workOrder.ot}
            workOrder={workOrder}
            currentStage={stage}
            onDateChange={onDateChange}
          />
        ))}
      </div>
    </div>
  );
}