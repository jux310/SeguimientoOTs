import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RestoreBackupProps {
  onClose: () => void;
}

export function RestoreBackup({ onClose }: RestoreBackupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            throw new Error('Error al leer el archivo');
          }

          const backupData = JSON.parse(e.target.result as string);
          
          // Call the restore function
          const { data, error } = await supabase.rpc('restore_backup', {
            backup: backupData
          });

          if (error) throw error;

          if (data === true) {
            alert('Backup restaurado exitosamente');
            onClose();
            // Reload the page to reflect changes
            window.location.reload();
          } else {
            throw new Error('Error al restaurar el backup');
          }
        } catch (err) {
          console.error('Error parsing backup:', err);
          setError(err instanceof Error ? err.message : 'Error al procesar el archivo de backup');
        }
      };

      reader.readAsText(file);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError(err instanceof Error ? err.message : 'Error al restaurar el backup');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={loading}
      />
      <button
        className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
          loading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Upload className="w-4 h-4 shrink-0" />
        {loading ? 'Restaurando...' : 'Restaurar Backup'}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}