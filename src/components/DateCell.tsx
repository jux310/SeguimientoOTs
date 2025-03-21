import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Check, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

interface DateCellProps {
  date: { date: string; confirmed: boolean } | null;
  onDateChange: (date: string | null | undefined, confirmed: boolean) => void;
  workOrderOt: string;
  stageName: string;
  hasIssues?: boolean;
  disabled?: boolean;
}

interface DateDisplayProps {
  date: string;
  confirmed: boolean;
  onClick: () => void;
  hasIssues?: boolean;
  disabled?: boolean;
}

function DateDisplay({ date, confirmed, onClick, hasIssues, disabled }: DateDisplayProps) {
  const getDateColor = (dateStr: string, confirmed: boolean) => {
    if (confirmed) return 'text-gray-900 font-normal';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = dateStr.split('-');
    const dateValue = new Date(Number(year), Number(month) - 1, Number(day));
    dateValue.setHours(0, 0, 0, 0);

    return dateValue < today ? 'text-orange-600' : 'text-blue-600';
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-1 justify-center p-2 ${
        disabled ? 'bg-gray-50' :
        `hover:bg-gray-50 cursor-pointer ${getDateColor(date, confirmed)}`
      }`}
    >
      <span>{formatDate(date)}</span>
      {hasIssues && (
        <AlertTriangle className="w-4 h-4 text-orange-500" />
      )}
    </div>
  );
}

export function DateCell({ date, onDateChange, workOrderOt, stageName, hasIssues, disabled = false }: DateCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [wantsToConfirm, setWantsToConfirm] = useState(false);

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(true);
      if (date?.date) {
        setTempDate(parseLocalDate(date.date));
      }
      setShowCalendar(!date?.date);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setTempDate(date);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setTempDate(null);
      return;
    }
    
    const [day, month, year] = value.split('/').map(Number);
    if (day && month && year) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        setTempDate(date);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };


  const handleConfirm = () => {
    if (tempDate) {
      onDateChange(format(tempDate, 'yyyy-MM-dd'), wantsToConfirm);
    } else {
      onDateChange(undefined, wantsToConfirm);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(null);
    setWantsToConfirm(false);
    setIsOpen(false);
  };

  return (
    <>
      {date?.date ? (
        <DateDisplay
          date={date.date}
          confirmed={date.confirmed}
          hasIssues={hasIssues}
          onClick={handleClick}
          disabled={disabled}
        />
      ) : (
        <div
          onClick={disabled ? undefined : handleClick}
          className={`flex items-center justify-center p-2 ${
            disabled ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
          } ${hasIssues ? 'text-orange-500' : 'text-gray-400'}`}
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          {hasIssues && (
            <AlertTriangle className="w-4 h-4 ml-1" />
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50">
          <div className="fixed inset-0" onClick={handleCancel} />
          <div className="fixed inset-0 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl border p-4 w-[300px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900">
                    OT {workOrderOt}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 -mt-1">
                  Fecha de {stageName}
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempDate ? format(tempDate, 'dd/MM/yyyy') : ''}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="DD/MM/AAAA"
                    className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>

                {showCalendar && (
                  <DatePicker
                    selected={tempDate}
                    onChange={handleDateChange}
                    locale={es}
                    dateFormat="dd/MM/yyyy"
                    inline
                    todayButton="Hoy"
                    placeholderText="Seleccionar fecha"
                    isClearable
                    onKeyDown={handleKeyDown}
                    calendarClassName="!border-0 !font-sans"
                    dayClassName={() => "!text-sm hover:!bg-gray-100"}
                    showMonthDropdown={false}
                    showYearDropdown={false}
                  />
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantsToConfirm}
                    onChange={(e) => setWantsToConfirm(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-offset-0 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Confirmar fecha</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-white rounded-md text-sm ${
                      wantsToConfirm ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {wantsToConfirm ? 'Confirmar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}