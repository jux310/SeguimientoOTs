import React, { useRef, useEffect, useState } from 'react';
import { DateCell } from './DateCell';
import { WorkOrder, Stage } from '../types';
import { useIssues } from '../hooks/useIssues';
import { AlertCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { WorkOrderDetails } from './WorkOrderDetails';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { supabase } from '../lib/supabase';

function TruncatedDescription({ text }: { text: string }) {
  return (
    <div className="group relative">
      <div className="truncate max-w-[100px]">
        {text}
      </div>
      {text && (
        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white p-2 rounded shadow-lg max-w-sm whitespace-normal break-words left-0 mt-1">
          {text}
        </div>
      )}
    </div>
  );
}

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  stages: Stage[];
  onDateChange: (ot: string, stage: string, date: string, confirmed: boolean) => void;
  isArchived?: boolean;
}

export function WorkOrderTable({
  workOrders,
  stages,
  onDateChange,
  isArchived = false,
}: WorkOrderTableProps) {
  const { issues } = useIssues(workOrders);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'juancruzcybulski@gmail.com');
    }
    checkAdminStatus();
  }, []);

  // Sort work orders by progress in descending order
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    // Sort by priority first
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    // Then by progress
    return b.progress - a.progress;
  });

  const getStageIssues = (workOrderId: string, stageName: string) => {
    return issues.some(issue => 
      issue.work_order_id === workOrderId && 
      issue.stage === stageName && 
      issue.status === 'OPEN'
    );
  };

  const calculateTotalDelay = (workOrderId: string) => {
    const workOrderIssues = issues.filter(issue => issue.work_order_id === workOrderId);
    let totalDays = 0;

    workOrderIssues.forEach(issue => {
      if (issue.delay) {
        const startDate = new Date(issue.delay.start_date);
        const endDate = issue.delay.end_date ? new Date(issue.delay.end_date) : new Date();
        totalDays += differenceInDays(endDate, startDate) + 1;
      }
    });

    return totalDays;
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div ref={scrollContainerRef} className="overflow-auto smooth-scroll hide-scrollbar">
        <table className="min-w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">OT</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">Cliente</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">Descripción</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">TAG</th>
            {!isArchived && (
              <>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">Avance</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer">Retraso</th>
              </>
            )}
            {stages.map((stage) => (
              <th key={`header-${stage.name}`} className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                {stage.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedWorkOrders.map((wo) => (
            <tr 
              key={wo.ot} 
              className={`hover:bg-gray-50 ${wo.priority ? 'bg-yellow-50' : ''}`}
            >
              <td 
                className="px-4 py-2"
              >
                <span 
                  className="cursor-pointer hover:text-blue-600" 
                  onClick={() => setSelectedWorkOrder(wo)}
                >
                  {wo.ot}
                </span>
              </td>
              <td 
                className="px-4 py-2 cursor-pointer hover:text-blue-600"
                onClick={() => setSelectedWorkOrder(wo)}
              >
                {wo.client}
              </td>
              <td 
                className="px-4 py-2 cursor-pointer hover:text-blue-600"
                onClick={() => setSelectedWorkOrder(wo)}
              >
                <TruncatedDescription text={wo.description} />
              </td>
              <td 
                className="px-4 py-2 whitespace-nowrap cursor-pointer hover:text-blue-600"
                onClick={() => setSelectedWorkOrder(wo)}
              >
                {wo.tag}
              </td>
              {!isArchived && (
                <>
                  <td 
                    className="px-4 py-2 cursor-pointer hover:text-blue-600"
                    onClick={() => setSelectedWorkOrder(wo)}
                  >
                    {wo.status}
                  </td>
                  <td 
                    className="px-4 py-2 cursor-pointer hover:text-blue-600"
                    onClick={() => setSelectedWorkOrder(wo)}
                  >
                    {wo.progress}%
                  </td>
                  <td 
                    className="px-4 py-2 cursor-pointer hover:text-blue-600"
                    onClick={() => setSelectedWorkOrder(wo)}
                  >
                    <span className="whitespace-nowrap">{calculateTotalDelay(wo.id) > 0 ? `${calculateTotalDelay(wo.id)} días` : '-'}</span>
                  </td>
                </>
              )}
              {stages.map((stage) => (
                <td key={`${wo.ot}-${stage.name}`} className="px-4 py-2">
                  <DateCell
                    date={wo.dates[stage.name] || null}
                    workOrderOt={wo.ot}
                    stageName={stage.name}
                    hasIssues={getStageIssues(wo.id, stage.name)}
                    workOrderId={wo.id}
                    onDateChange={(date, confirmed) => onDateChange(wo.ot, stage.name, date, confirmed, isArchived ? 'ARCHIVED' : wo.location)}
                    disabled={isArchived && !isAdmin}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {selectedWorkOrder && (
        <WorkOrderDetails
          workOrder={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          totalDelay={calculateTotalDelay(selectedWorkOrder.id)}
          key={selectedWorkOrder.id}
        />
      )}
    </div>
  );
}