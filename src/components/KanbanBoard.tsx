import React, { useRef, useEffect } from 'react';
import { WorkOrder, Stage } from '../types';
import { KanbanColumn } from './KanbanColumn';

function getWorkOrderStage(workOrder: WorkOrder, stages: Stage[]): { current: Stage | null; next: Stage | null } {
  let currentStage: Stage | null = null;
  let nextStage: Stage | null = null;
  
  for (const stage of stages) {
    if (workOrder.dates[stage.name]?.confirmed) {
      currentStage = stage;
    }
  }

  if (currentStage) {
    const currentIndex = stages.findIndex(s => s.name === currentStage?.name);
    if (currentIndex < stages.length - 1) {
      nextStage = stages[currentIndex + 1];
    }
  } else {
    // If no stage is confirmed, the work order should be in the first stage
    nextStage = stages[0];
  }
  
  return { current: currentStage, next: nextStage };
}

interface KanbanBoardProps {
  workOrders: WorkOrder[];
  stages: Stage[];
  onDateChange: (ot: string, stage: string, date: string, confirmed: boolean) => void;
}

export function KanbanBoard({ workOrders, stages, onDateChange }: KanbanBoardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto pb-4 smooth-scroll">
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.name}
          stage={stage}
          workOrders={workOrders.filter(wo => {
            const { next } = getWorkOrderStage(wo, stages);
            return next?.name === stage.name;
          })}
          onDateChange={onDateChange}
          stages={stages}
        />
      ))}
    </div>
  );
}