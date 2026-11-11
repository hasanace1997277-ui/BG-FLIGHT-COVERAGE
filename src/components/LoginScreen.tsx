import React, { useState } from 'react';
import { Radio, Plane, FileSpreadsheet, ArrowRight, UserCheck, IdCard } from 'lucide-react';
import { UserRole } from '../types/aviation';

interface LoginScreenProps {
  onLogin: (role: UserRole, staffName: string, staffId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  // Coverage Man credentials
  const [coverageName, setCoverageName] = useState('H. Razak');
  const [coverageStaffId, setCoverageStaffId] = useState('CM-4082');

  // Load Controller credentials
  const [loadControllerName, setLoadControllerName] = useState('M. Farooq');
  const [loadControllerStaffId, setLoadControllerStaffId] = useState('LC-1024');

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* App Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
            <Plane className="w-8 h-8 -rotate-45" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            AEROTURN
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Flight Coverage Telemetry &amp; Real-time Load Control System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Database Persistent Storage Active</span>
          </div>
        </div>

        {/* The Two Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OPTION 1: Coverage Man */}
          <div className="bg-slate-900/90 hover:bg-slate-900 border-2 border-amber-500/60 hover:border-amber-400 rounded-3xl p-6 sm:p-7 shadow-2xl transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ea7e31]/20 border border-[#ea7e31]/50 flex items-center justify-center text-[#ea7e31]">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Edit &amp; Transmit
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition">
                Log In as Coverage Man
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Tarmac &amp; Apron coordinator. Press Touch Down, Chocks On, Door Open, and Push Back buttons in 0000 Local Time, log Reg, Capt, Crew (2/5), and send fuel figures.
              </p>

              {/* Name & Staff ID Inputs */}
              <div className="mt-5 space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase block mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Staff Name:</span>
                  </label>
                  <input
                    type="text"
                    value={coverageName}
                    onChange={(e) => setCoverageName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. H. Razak"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase block mb-1 flex items-center gap-1">
                    <IdCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Staff ID:</span>
                  </label>
                  <input
                    type="text"
                    value={coverageStaffId}
                    onChange={(e) => setCoverageStaffId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    placeholder="e.g. CM-4082"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onLogin('COVERAGE_MAN', coverageName, coverageStaffId)}
              className="mt-6 w-full py-3.5 px-4 bg-[#ea7e31] hover:brightness-110 text-black font-bold text-sm tracking-wide rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Continue as Coverage Man</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* OPTION 2: Load Controller */}
          <div className="bg-slate-900/90 hover:bg-slate-900 border-2 border-blue-500/60 hover:border-blue-400 rounded-3xl p-6 sm:p-7 shadow-2xl transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4271c7]/20 border border-[#4271c7]/50 flex items-center justify-center text-[#4271c7]">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Read-Only View
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition">
                Log In as Load Controller
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Central Load Planning / OCC. View all flight turnaround data in a clean real-time table organized by date, and export full reports as <strong>.xlsx Excel files</strong>.
              </p>

              {/* Name & Staff ID Inputs */}
              <div className="mt-5 space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase block mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Staff Name:</span>
                  </label>
                  <input
                    type="text"
                    value={loadControllerName}
                    onChange={(e) => setLoadControllerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. M. Farooq"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase block mb-1 flex items-center gap-1">
                    <IdCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Staff ID:</span>
                  </label>
                  <input
                    type="text"
                    value={loadControllerStaffId}
                    onChange={(e) => setLoadControllerStaffId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-blue-300 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="e.g. LC-1024"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onLogin('LOAD_CONTROLLER', loadControllerName, loadControllerStaffId)}
              className="mt-6 w-full py-3.5 px-4 bg-[#4271c7] hover:brightness-110 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Continue as Load Controller</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
