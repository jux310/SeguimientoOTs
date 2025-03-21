import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { WorkOrder } from '../types';
import { DateCell } from './DateCell';
import { useIssues } from '../hooks/useIssues';
import { WorkOrderDetails } from './WorkOrderDetails';

interface KanbanCardProps {
  workOrder: WorkOrder;
  currentStage: Stage;
  onDateChange: (ot: string, stage: string, date: string, confirmed: boolean) => void;
}

export function KanbanCard({ workOrder, currentStage, onDateChange }: KanbanCardProps) {
  const { issues } = useIssues([workOrder]);
  const [showDetails, setShowDetails] = useState(false);
  const currentDate = workOrder.dates[currentStage.name]?.date;
  const isDateConfirmed = workOrder.dates[currentStage.name]?.confirmed;

  const hasIssues = issues.some(issue => 
    issue.work_order_id === workOrder.id && 
    issue.stage === currentStage.name && 
    issue.status === 'OPEN'
  );

  return (
    <div className={`p-2 rounded-lg shadow-sm border border-gray-200 group relative ${
      workOrder.priority ? 'bg-yellow-50' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-1">
        <span 
          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={() => setShowDetails(true)}
        >
          OT {workOrder.ot}
        </span>
        <span className="text-xs text-gray-500">{workOrder.progress}%</span>
      </div>
      <div className="grid grid-cols-2 gap-1 mb-1">
        <p className="text-xs text-gray-600 truncate">{workOrder.client}</p>
        <p className="text-xs text-gray-500 truncate text-right">{workOrder.tag}</p>
      </div>

      <div className="flex justify-center">
        <DateCell
          date={currentDate ? { date: currentDate, confirmed: isDateConfirmed } : null}
          hasIssues={hasIssues}
          workOrderId={workOrder.id}
          onDateChange={(date, confirmed) => {
            if (date) {
              onDateChange(workOrder.ot, currentStage.name, date, confirmed);
            }
          }}
          workOrderOt={workOrder.ot}
          stageName={currentStage.name}
        />
      </div>
      {showDetails && (
        <WorkOrderDetails
          workOrder={workOrder}
          onClose={() => setShowDetails(false)}
          totalDelay={issues.reduce((total, issue) => {
            if (!issue.delay) return total;
            const startDate = new Date(issue.delay.start_date);
            const endDate = issue.delay.end_date ? new Date(issue.delay.end_date) : new Date();
            return total + (differenceInDays(endDate, startDate) + 1);
          }, 0)}
          key={workOrder.id}
        />
      )}
    </div>
  );
}