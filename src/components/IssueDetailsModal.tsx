import React, { useState } from 'react';
import { X, AlertCircle, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Issue } from '../hooks/useIssues';
import { WorkOrder, INCO_STAGES, ANTI_STAGES, Stage } from '../types';
import DatePicker from 'react-datepicker';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface IssueDetailsModalProps {
  issue: Issue;
  workOrder: WorkOrder | undefined;
  onClose: () => void;
  onUpdateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  onUpdateStatus: (status: Issue['status']) => void;
  location: 'INCO' | 'ANTI';
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  return date;
};

export function IssueDetailsModal({ issue, workOrder, onClose, onUpdateIssue, onUpdateStatus, location }: IssueDetailsModalProps) {
  const priorityColors = {
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

  const priorityIcons = {
    LOW: <Clock className="w-4 h-4" />,
    MEDIUM: <AlertCircle className="w-4 h-4" />,
    HIGH: <AlertTriangle className="w-4 h-4" />,
    CRITICAL: <AlertTriangle className="w-4 h-4" />,
  };

  const statusColors = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    OPEN: 'Abierto',
    RESOLVED: 'Resuelto',
  };

  const statusIcons = {
    OPEN: <AlertCircle className="w-4 h-4" />,
    RESOLVED: <CheckCircle2 className="w-4 h-4" />,
  };

  const [newNote, setNewNote] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [localDelay, setLocalDelay] = useState<IssueDelay | null>(issue.delay || null);
  const [delayStart, setDelayStart] = useState<Date | null>(
    issue.delay?.start_date ? parseLocalDate(issue.delay.start_date) : null
  );
  const [delayEnd, setDelayEnd] = useState<Date | null>(
    issue.delay?.end_date ? parseLocalDate(issue.delay.end_date) : null
  );
  const [localPriority, setLocalPriority] = useState(issue.priority);
  const [localStage, setLocalStage] = useState(issue.stage);
  const [localStatus, setLocalStatus] = useState(issue.status);

  const availableStages: Stage[] = location === 'INCO' ? INCO_STAGES : ANTI_STAGES;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onUpdateIssue(issue.id, { notes: newNote });
    setNewNote('');
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNote();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{issue.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                OT: {workOrder?.ot} - {workOrder?.client}
              </p>
              <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                <p>Creado el {formatDateTime(issue.created_at)}</p>
                <p>Última actualización: {formatDateTime(issue.updated_at)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors -mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Prioridad:</span>
              <div className="relative group">
                <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${priorityColors[issue.priority]}`}>
                  {priorityIcons[issue.priority]}
                  {priorityLabels[localPriority]}
                </button>
                <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    {[
                      { value: 'LOW', label: 'Baja' },
                      { value: 'MEDIUM', label: 'Media' },
                      { value: 'HIGH', label: 'Alta' },
                      { value: 'CRITICAL', label: 'Crítica' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setLocalPriority(value as Issue['priority']);
                          onUpdateIssue(issue.id, { priority: value as Issue['priority'] });
                          setHasChanges(true);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          value === localPriority
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Estado:</span>
              <div className="relative group">
                <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusColors[issue.status]}`}>
                  {statusIcons[issue.status]}
                  {statusLabels[localStatus]}
                </button>
                <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    {['OPEN', 'RESOLVED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setLocalStatus(status as Issue['status']);
                          onUpdateStatus(status as Issue['status']);
                          setHasChanges(true);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          status === localStatus
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {statusLabels[status as keyof typeof statusLabels]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Etapa:</span>
              <div className="relative group">
                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700">
                  {localStage || 'Sin etapa específica'}
                </button>
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setLocalStage(null);
                        onUpdateIssue(issue.id, { stage: null });
                        setHasChanges(true);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        !localStage
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Sin etapa específica
                    </button>
                    {availableStages.map((stage) => (
                      <button
                        key={stage.name}
                        onClick={() => {
                          setLocalStage(stage.name);
                          onUpdateIssue(issue.id, { stage: stage.name });
                          setHasChanges(true);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          stage.name === localStage
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {stage.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 border-t border-gray-200">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">Demoras de Producción</h3>
              {!showDelayForm && (issue.priority === 'HIGH' || issue.priority === 'CRITICAL') && (
                <button
                  onClick={() => setShowDelayForm(!showDelayForm)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {localDelay ? 'Editar Demora' : 'Agregar Demora'}
                </button>
              )}
            </div>

            {showDelayForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <DatePicker
                      selected={delayStart}
                      onChange={setDelayStart}
                      locale={es}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Seleccionar fecha"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxDate={new Date()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Fin
                    </label>
                    <DatePicker
                      selected={delayEnd}
                      onChange={setDelayEnd}
                      locale={es}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Seleccionar fecha"
                      minDate={delayStart}
                      isClearable
                      maxDate={new Date()}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {delayStart && (
                  <div className="mt-2 text-sm text-gray-600">
                    Días de demora: {delayEnd ? differenceInDays(delayEnd, delayStart) + 1 : '?'} días
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowDelayForm(false);
                      if (!localDelay) {
                        setDelayStart(null);
                        setDelayEnd(null);
                      } else {
                        setDelayStart(new Date(localDelay.start_date));
                        setDelayEnd(localDelay.end_date ? new Date(localDelay.end_date) : null);
                      }
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 mr-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!delayStart) return;
                      try {
                        const newDelay = {
                          start_date: format(new Date(delayStart.setHours(12)), 'yyyy-MM-dd'),
                          end_date: delayEnd ? format(new Date(delayEnd.setHours(12)), 'yyyy-MM-dd') : null
                        };
                        
                        await onUpdateIssue(issue.id, { delay: newDelay });
                        
                        setDelayStart(null);
                        setDelayEnd(null);
                        setLocalDelay(newDelay);
                        setShowDelayForm(false);
                      } catch (error) {
                        console.error('Error saving delay:', error);
                        alert('Error al guardar la demora');
                      }
                    }}
                    disabled={!delayStart}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {localDelay ? 'Actualizar Demora' : 'Guardar Demora'}
                  </button>
                </div>
              </div>
            )}

            {localDelay && !showDelayForm ? (
              <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                   onClick={() => setShowDelayForm(true)}
            >
                <div>
                  <span className="font-medium">
                    {format(parseLocalDate(localDelay.start_date), 'dd/MM/yyyy')}
                  </span>
                  {' → '}
                  {localDelay.end_date ? (
                    <>
                      <span className="font-medium">
                        {format(parseLocalDate(localDelay.end_date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({differenceInDays(parseLocalDate(localDelay.end_date), parseLocalDate(localDelay.start_date)) + 1} días)
                      </span>
                    </>
                  ) : (
                    <span className="text-orange-600">En curso</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {issue.priority === 'HIGH' || issue.priority === 'CRITICAL' 
                  ? 'No hay demoras registradas'
                  : 'Las demoras solo están disponibles para problemas de prioridad alta o crítica'}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1">
          <div className="prose max-w-none">
            <div className="space-y-4">
              {issue.issue_notes?.map((note) => (
                <div key={note.id} className="bg-gray-50/50 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">{note.user_email?.split('@')[0]}</span>
                    <span> - {formatDateTime(note.created_at)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}

              <div className="pt-2">
                <div className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50/50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none transition-colors placeholder:text-gray-400"
                    placeholder="Agregar una nueva nota (Ctrl + Enter para enviar)"
                  />
                  <div className="flex justify-end">
                    {newNote.trim() && (
                      <button
                        onClick={handleAddNote}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Agregar Nota
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                if (hasChanges) {
                  onClose();
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 text-gray-600 bg-white/80 rounded-lg hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            )}
            {issue.status !== 'RESOLVED' && hasChanges && (
              <button
                onClick={() => {
                  onUpdateStatus('RESOLVED');
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Marcar como Resuelto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}