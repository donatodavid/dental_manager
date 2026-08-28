import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, HardDrive, CheckCircle2, ShieldCheck, FileJson, Table, X } from 'lucide-react';
import { ClinicalDatabase, DatabaseStats } from '../../services/db';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReloaded: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  onDataReloaded
}) => {
  const [stats, setStats] = useState<DatabaseStats>(() => ClinicalDatabase.getStats());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStats(ClinicalDatabase.getStats());
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    ClinicalDatabase.exportDatabaseJSON();
    setNotification({
      type: 'success',
      message: 'Copia de seguridad (Backup JSON) descargada exitosamente.'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = ClinicalDatabase.importDatabaseJSON(content);
        if (res.success) {
          setStats(ClinicalDatabase.getStats());
          setNotification({ type: 'success', message: 'Base de datos restaurada con éxito.' });
          onDataReloaded();
        } else {
          setNotification({ type: 'error', message: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de restablecer todos los registros a los datos de fábrica? Esta acción no se puede deshacer.')) {
      ClinicalDatabase.resetToDemoData();
      setStats(ClinicalDatabase.getStats());
      setNotification({ type: 'success', message: 'Base de datos restablecida a valores iniciales.' });
      onDataReloaded();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                Gestor de Base de Datos
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PERSISTENTE (ONLINE)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Almacenamiento persistente de fichas clínicas, presupuestos con piezas dentales y caja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            notification.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Database Tables & Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-teal-400" /> Pacientes
            </span>
            <span className="text-2xl font-black font-mono text-teal-300 mt-1">{stats.patientsCount}</span>
            <span className="text-[10px] text-slate-500">Fichas clínicas</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-emerald-400" /> Presupuestos
            </span>
            <span className="text-2xl font-black font-mono text-emerald-300 mt-1">{stats.budgetsCount}</span>
            <span className="text-[10px] text-slate-500">Planes guardados</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-blue-400" /> Citas Agenda
            </span>
            <span className="text-2xl font-black font-mono text-blue-300 mt-1">{stats.appointmentsCount}</span>
            <span className="text-[10px] text-slate-500">Horas médicas</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-purple-400" /> Cobros / Caja
            </span>
            <span className="text-2xl font-black font-mono text-purple-300 mt-1">{stats.paymentsCount}</span>
            <span className="text-[10px] text-slate-500">Comprobantes</span>
          </div>
        </div>

        {/* Persistence Status Info */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <HardDrive className="w-4 h-4 text-teal-400" />
              Almacenamiento Local Activo:
            </span>
            <span className="font-mono text-teal-300 font-bold">{stats.storageSizeKb} KB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Sincronización Automática:
            </span>
            <span className="text-emerald-400 font-medium">En tiempo real ante cada cambio</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            Última actualización: {new Date(stats.lastUpdated).toLocaleDateString()} {new Date(stats.lastUpdated).toLocaleTimeString()}
          </div>
        </div>

        {/* Database Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Export JSON Backup */}
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar Backup JSON
            </button>

            {/* Import JSON Backup */}
            <label className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-teal-400" />
              Importar Backup
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-3 py-2 text-slate-400 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-red-950/30 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restablecer a Datos de Prueba
          </button>
        </div>

      </div>
    </div>
  );
};
