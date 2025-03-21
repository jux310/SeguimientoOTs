import React from 'react';
import { BarChart3, Clock, Star, AlertTriangle, Book, Download, Upload, MoreVertical } from 'lucide-react';
import { WorkOrder, INCO_STAGES, ANTI_STAGES } from '../types';
import { ChangeHistory } from './ChangeHistory';
import { NewWorkOrderForm } from './NewWorkOrderForm';
import { RestoreBackup } from './RestoreBackup';
import { useIssues } from '../hooks/useIssues';
import { differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface DashboardProps {
  incoOrders: WorkOrder[];
  antiOrders: WorkOrder[];
  archivedOrders: WorkOrder[];
  changeHistory: any[];
  createWorkOrder: (workOrder: WorkOrder) => Promise<any>;
}

function BackupMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  downloadBackup();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Descargar Backup
              </button>
              <div className="relative">
                <RestoreBackup onClose={() => setIsOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

async function downloadBackup() {
  try {
    const { data, error } = await supabase.rpc('create_backup');

    if (error) throw error;

    // Create blob and download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error creating backup:', error);
    alert('Error al crear el backup. Por favor, intente nuevamente.');
  }
}

export function Dashboard({ incoOrders, antiOrders, archivedOrders, changeHistory, createWorkOrder }: DashboardProps) {
  const { issues } = useIssues([...incoOrders, ...antiOrders]);
  const totalOrders = incoOrders.length + antiOrders.length + archivedOrders.length;
  const [isAdmin, setIsAdmin] = useState(false);
  const inProgressOrders = incoOrders.length + antiOrders.length;
  const completedOrders = archivedOrders.length;

  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'juancruzcybulski@gmail.com');
    }
    checkAdminStatus();
  }, []);

  const priorityOrders = [...incoOrders, ...antiOrders].filter(order => order.priority);

  const calculateAverageTime = (orders: WorkOrder[], stages: typeof INCO_STAGES | typeof ANTI_STAGES) => {
    const completedOrders = orders.filter(order => {
      const firstStage = stages[0].name;
      const lastStage = stages[stages.length - 1].name;
      return order.dates[firstStage]?.date && order.dates[lastStage]?.date;
    });

    if (completedOrders.length === 0) return null;

    const totalDays = completedOrders.reduce((sum, order) => {
      const firstStage = stages[0].name;
      const lastStage = stages[stages.length - 1].name;
      const startDate = new Date(order.dates[firstStage].date);
      const endDate = new Date(order.dates[lastStage].date);
      return sum + differenceInDays(endDate, startDate);
    }, 0);

    return Math.round(totalDays / completedOrders.length);
  };

  const incoAverage = calculateAverageTime(incoOrders, INCO_STAGES);
  const antiAverage = calculateAverageTime(antiOrders, ANTI_STAGES);
  const totalAverage = calculateAverageTime([...incoOrders, ...antiOrders], [...INCO_STAGES, ...ANTI_STAGES]);

  const getCurrentStage = (workOrder: WorkOrder) => {
    const stages = workOrder.location === 'INCO' ? INCO_STAGES : ANTI_STAGES;
    let currentStage = 'Sin iniciar';
    
    for (const stage of stages) {
      if (workOrder.dates[stage.name]?.confirmed) {
        currentStage = stage.name;
      }
    }
    
    return currentStage;
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <NewWorkOrderForm onSubmit={createWorkOrder} />
            </div>
            <BackupMenu />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-[#00843D]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total OTs</p>
              <p className="text-2xl font-semibold">{totalOrders}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-xl font-medium">{inProgressOrders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-xl font-medium">{completedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-semibold">
                {totalAverage ? `${totalAverage} días` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Incomet</p>
              <p className="text-xl font-medium">{incoAverage ? `${incoAverage} días` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Anticorr</p>
              <p className="text-xl font-medium">{antiAverage ? `${antiAverage} días` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">OTs Prioritarias</p>
              <p className="text-2xl font-semibold">{priorityOrders.length}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {priorityOrders.slice(0, 3).map(order => (
              <div key={order.ot} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">OT {order.ot}</span>
                <span className="text-sm font-medium">{getCurrentStage(order)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Problemas Actuales</h3>
            </div>
          </div>
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-medium text-[#00843D] mb-3 flex items-center gap-2 pb-2 border-b">
                Incomet ({incoOrders.length} OTs)
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Baja', priority: 'LOW' },
                  { label: 'Media', priority: 'MEDIUM' },
                  { label: 'Alta', priority: 'HIGH' },
                  { label: 'Crítica', priority: 'CRITICAL' }
                ].map(({ label, priority }) => (
                  <div key={priority} className="flex items-center justify-between px-3 py-0">
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className={`text-sm font-medium ${
                      priority === 'CRITICAL' ? 'text-red-600' :
                      priority === 'HIGH' ? 'text-orange-600' :
                      priority === 'MEDIUM' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {issues.filter(i => 
                        incoOrders.some(wo => wo.id === i.work_order_id) && 
                        i.status === 'OPEN' && 
                        i.priority === priority
                      ).length}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Anticorr Section */}
            <section>
              <h4 className="text-sm font-medium text-[#BF0900] mb-3 flex items-center gap-2 pb-2 border-b">
                Anticorr ({antiOrders.length} OTs)
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Baja', priority: 'LOW' },
                  { label: 'Media', priority: 'MEDIUM' },
                  { label: 'Alta', priority: 'HIGH' },
                  { label: 'Crítica', priority: 'CRITICAL' }
                ].map(({ label, priority }) => (
                  <div key={priority} className="flex items-center justify-between px-3 py-0">
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className={`text-sm font-medium ${
                      priority === 'CRITICAL' ? 'text-red-600' :
                      priority === 'HIGH' ? 'text-orange-600' :
                      priority === 'MEDIUM' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {issues.filter(i => 
                        antiOrders.some(wo => wo.id === i.work_order_id) && 
                        i.status === 'OPEN' && 
                        i.priority === priority
                      ).length}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Book className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Estado Actual</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#00843D]">Incomet</span>
                <span className="text-sm font-medium">{incoOrders.length} OTs</span>
              </div>
              <div className="space-y-1">
                {INCO_STAGES.map(stage => {
                  const count = incoOrders.filter(order => 
                    order.dates[stage.name]?.confirmed
                  ).length;
                  return (
                    <div key={stage.name} className="flex justify-between items-center px-3 py-0.5 text-xs">
                      <span className="text-gray-600">{stage.name}</span>
                      <span className="text-gray-700">{count} </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#BF0900]">Anticorr</span>
                <span className="text-sm font-medium">{antiOrders.length} OTs</span>
              </div>
              <div className="space-y-1">
                {ANTI_STAGES.map(stage => {
                  const count = antiOrders.filter(order => 
                    order.dates[stage.name]?.confirmed
                  ).length;
                  return (
                    <div key={stage.name} className="flex justify-between items-center px-3 py-0.5 text-xs">
                      <span className="text-gray-600">{stage.name}</span>
                      <span className="text-gray-700">{count} </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Despachados</span>
                <span className="text-sm font-medium">{archivedOrders.length} OTs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <ChangeHistory history={changeHistory} />
      </div>
    </div>
  );
}

export default Dashboard