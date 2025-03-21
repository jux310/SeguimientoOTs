import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Plus, X, SlidersHorizontal } from 'lucide-react';
import { WorkOrder } from '../types';
import { useIssues } from '../hooks/useIssues';
import { differenceInDays } from 'date-fns';
import { IssueDetailsModal } from './IssueDetailsModal'; 
import { NewIssueForm } from './NewIssueForm';
import { supabase } from '../lib/supabase';

interface Issue {
  id: string;
  work_order_id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

interface IssueTrackerProps {
  workOrders: WorkOrder[];
  location: 'INCO' | 'ANTI';
}

function PriorityBadge({ priority }: { priority: Issue['priority'] }) {
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

function StatusBadge({ status }: { status: Issue['status'] }) {
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

function IssueTracker({ workOrders, location }: IssueTrackerProps) {
  const filteredWorkOrders = workOrders.filter(wo => wo.location === location);
  const { issues, loading, error, createIssue, updateIssue } = useIssues(filteredWorkOrders);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'priority' | 'ot'>('date-desc');
  const [filter, setFilter] = useState<'open' | 'resolved'>('open');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [groupByOT, setGroupByOT] = useState(true);
  
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

  // Load all issues regardless of status
  useEffect(() => {
    const loadAllIssues = async () => {
      try {
        const workOrderIds = filteredWorkOrders
          .filter(wo => wo && typeof wo === 'object' && 'id' in wo)
          .map(wo => wo.id)
          .filter(Boolean);

        if (workOrderIds.length === 0) {
          setAllIssues([]);
          return;
        }

        const { data, error } = await supabase
          .from('issues')
          .select(`
            *,
            issue_delays!inner (
              start_date,
              end_date
            )
          `)
          .in('work_order_id', workOrderIds);

        if (error) throw error;
        
        const issuesWithDelays = data?.map(issue => ({
          ...issue,
          delay: issue.issue_delays?.[0] 
            ? {
                start_date: issue.issue_delays[0].start_date,
                end_date: issue.issue_delays[0].end_date
              }
            : null
        })) || [];
        
        setAllIssues(issuesWithDelays);
      } catch (err) {
        console.error('Error loading all issues:', err);
        setAllIssues([]);
      }
    };

    loadAllIssues();
  }, [filteredWorkOrders]);

  const priorityOrder = {
    'CRITICAL': 0,
    'HIGH': 1,
    'MEDIUM': 2,
    'LOW': 3
  };

  // Filter and sort issues
  const sortedAndFilteredIssues = issues
  .filter(issue => {
    if (filter === 'open') return issue.status !== 'RESOLVED';
    return issue.status === 'RESOLVED';
  })
  .sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'ot':
        const woA = workOrders.find(wo => wo.id === a.work_order_id);
        const woB = workOrders.find(wo => wo.id === b.work_order_id);
        return (woA?.ot || '').localeCompare(woB?.ot || '');
      default:
        return 0;
    }
  });

  // Group issues by work order if enabled
  const groupedIssues = React.useMemo(() => {
    if (!groupByOT) return null;

    return sortedAndFilteredIssues.reduce((groups, issue) => {
      const workOrder = workOrders.find(wo => wo.id === issue.work_order_id);
      if (!workOrder) return groups;

      if (!groups[workOrder.ot]) {
        groups[workOrder.ot] = { workOrder, issues: [] };
      }
      groups[workOrder.ot].issues.push(issue);

      return groups;
    }, {} as Record<string, { workOrder: WorkOrder; issues: Issue[] }>);
  }, [sortedAndFilteredIssues, workOrders, groupByOT]);


  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">Problemas Reportados</h3>
            <button
              onClick={() => setShowNewIssueForm(true)}
              className="ml-4 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo Problema
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-900"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
              {showFilters && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-20">
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value as 'open' | 'resolved')}
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="open">Problemas Abiertos</option>
                          <option value="resolved">Problemas Resueltos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ordenar por
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="date-desc">Más recientes</option>
                          <option value="date-asc">Más antiguos</option>
                          <option value="priority">Por prioridad</option>
                          <option value="ot">Por número de OT</option>
                        </select>
                      </div>
                      <div className="pt-2 border-t">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={groupByOT}
                            onChange={(e) => setGroupByOT(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Agrupar por OT</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
      </div>

      <div className="p-4">
        {error && (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {showNewIssueForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nuevo Problema</h3>
                <button
                  onClick={() => setShowNewIssueForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NewIssueForm
                workOrders={filteredWorkOrders}
                onSubmit={createIssue}
                onClose={() => setShowNewIssueForm(false)}
                location={location}
              />
            </div>
          </div>
        )}

        {!groupByOT && sortedAndFilteredIssues.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay problemas reportados</p>
          </div>
        ) : groupByOT ? (
          <div className="space-y-8">
            {Object.entries(groupedIssues || {}).map(([ot, { workOrder, issues }]) => (
              <div key={ot} className="border-t first:border-t-0 pt-6 first:pt-0">
                <div className="flex items-center justify-between mb-4 px-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">OT {workOrder.ot}</h3>
                    <p className="text-sm text-gray-600">{workOrder.client}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      {issues.length} {issues.length === 1 ? 'problema' : 'problemas'}
                    </div>
                    {allIssues.some(i => i.work_order_id === workOrder.id && i.delay) && (
                      <div className="text-sm text-orange-600 font-medium flex items-center gap-1 justify-end">
                        <Clock className="w-4 h-4" />
                        {`${allIssues
                          .filter(i => i.work_order_id === workOrder.id)
                          .reduce((total, issue) => {
                            if (!issue.delay?.start_date) return total;
                            const startDate = new Date(issue.delay.start_date);
                            const endDate = issue.delay.end_date 
                              ? new Date(issue.delay.end_date) 
                              : new Date();
                            return total + Math.max(0, differenceInDays(endDate, startDate) + 1);
                          }, 0)} días de demora`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {issues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      workOrder={workOrder}
                      groupByOT={groupByOT}
                      onClick={() => setSelectedIssue(issue)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAndFilteredIssues.map(issue => {
              const workOrder = workOrders.find(wo => wo.id === issue.work_order_id);
              return (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  workOrder={workOrder}
                  groupByOT={groupByOT}
                  onClick={() => setSelectedIssue(issue)}
                />
              );
            })}
          </div>
        )}

        {selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            workOrder={workOrders.find(wo => wo.id === selectedIssue.work_order_id)}
            onClose={() => setSelectedIssue(null)}
            onUpdateIssue={async (id, updates) => {
              await updateIssue(id, updates);
            }}
            onUpdateStatus={(status) => {
              updateIssue(selectedIssue.id, { status });
              if (status === 'RESOLVED') {
                setSelectedIssue(null);
              }
            }}
            location={location}
          />
        )}
      </div>
    </div>
  ); 
} 
 
function IssueCard({
  issue, 
  workOrder, 
  onClick, 
  groupByOT 
}: { 
  issue: Issue; 
  workOrder?: WorkOrder; 
  onClick: () => void;
  groupByOT: boolean;
}) {
  return (
    <div
      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{issue.title}</h4>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            {!groupByOT ? (
              <span>
                OT: {workOrder?.ot} - {workOrder?.client} •{' '}
                {issues.filter(i => i.work_order_id === workOrder?.id).length} problemas
                {calculateTotalDelay(workOrder?.id || '') > 0 && (
                  <span className="text-orange-600">
                    {' '}• {calculateTotalDelay(workOrder?.id || '')} días de demora
                  </span>
                )}
              </span>
            ) : null}
            {issue.stage && (
              <>
                <span className="text-gray-400">•</span>
                <span>Etapa: {issue.stage}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {issue.delay && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Clock className="w-4 h-4" />
              {(() => {
                const startDate = new Date(issue.delay.start_date);
                const endDate = issue.delay.end_date ? new Date(issue.delay.end_date) : new Date();
                const days = differenceInDays(endDate, startDate) + 1;
                return `${days > 0 ? days : 0} días`;
              })()}
            </span>
          )}
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>
      {issue.issue_notes && issue.issue_notes.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <p className="truncate flex-1">{issue.issue_notes[issue.issue_notes.length - 1].content}</p>
          <span className="text-gray-500 ml-2 whitespace-nowrap font-medium">
            {issue.issue_notes[issue.issue_notes.length - 1].user_email?.split('@')[0]}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          Creado el{' '}
          {new Date(issue.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
        <span>
          Última actualización:{' '}
          {new Date(issue.updated_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

export { IssueTracker };

export { IssueTracker }