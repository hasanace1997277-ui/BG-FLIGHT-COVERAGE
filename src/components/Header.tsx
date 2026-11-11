import React, { useState, useEffect } from 'react';
import {
  Plane,
  Radio,
  Clock,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole } from '../types/aviation';

interface HeaderProps {
  currentRole: UserRole | null;
  operatorName: string;
  staffId: string;
  onRoleChange: (role: UserRole | null) => void;
  onOpenNewFlight: () => void;
  onReseedData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  operatorName,
  staffId,
  onRoleChange,
}) => {
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const lHours = String(now.getHours()).padStart(2, '0');
      const lMins = String(now.getMinutes()).padStart(2, '0');
      const lSecs = String(now.getSeconds()).padStart(2, '0');
      setLocalTime(`${lHours}:${lMins}:${lSecs} LCL`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black tracking-wider text-base text-white">AEROTURN</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                OPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Ramp Coverage &amp; Load Control Telemetry</p>
          </div>
        </div>

        {/* Center: Current Role Switcher (Coverage Man vs Load Controller) */}
        {currentRole && (
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => onRoleChange('COVERAGE_MAN')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentRole === 'COVERAGE_MAN'
                  ? 'bg-[#ea7e31] text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Coverage Man (Edit)</span>
            </button>

            <button
              onClick={() => onRoleChange('LOAD_CONTROLLER')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentRole === 'LOAD_CONTROLLER'
                  ? 'bg-[#4271c7] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Load Controller (Table View)</span>
            </button>
          </div>
        )}

        {/* Right Info & Actions */}
        <div className="flex items-center space-x-3">
          {/* Local Time Clock */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 font-mono text-xs shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-bold tracking-wider">{localTime || '00:00:00 LCL'}</span>
            <span className="text-[9px] text-slate-400 font-sans font-semibold">LOCAL</span>
          </div>

          {/* User info & switch */}
          {currentRole ? (
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs text-white font-bold font-mono">
                  {operatorName}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  ID: {staffId}
                </span>
              </div>
              <button
                onClick={() => onRoleChange(null)}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition cursor-pointer"
                title="Switch User / Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Role</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono">
              Please choose a role to proceed
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
