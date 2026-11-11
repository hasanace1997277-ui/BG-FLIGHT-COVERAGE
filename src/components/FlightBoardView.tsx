import React from 'react';
import {
  Plane,
  Fuel,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  Gauge,
} from 'lucide-react';
import { FlightTurn, UserRole } from '../types/aviation';
import { formatUtcTime } from '../services/flightService';

interface FlightBoardViewProps {
  flights: FlightTurn[];
  onSelectFlight: (id: string, role: UserRole) => void;
}

export const FlightBoardView: React.FC<FlightBoardViewProps> = ({
  flights,
  onSelectFlight,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black font-mono text-white tracking-wide flex items-center gap-2">
            <Plane className="w-5 h-5 text-emerald-400 -rotate-45" />
            <span>Active Apron Flight Turnaround Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time gate and stand status, telemetry milestones, and captain fuel figures
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">{flights.length} Scheduled Turns</span>
          </div>
        </div>
      </div>

      {/* Flight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flights.map((flight) => {
          const milestonesCompleted = [
            Boolean(flight.touchDownTime),
            Boolean(flight.chocksOnTime),
            Boolean(flight.doorOpenTime),
            Boolean(flight.captainFinalFuel),
            Boolean(flight.doorCloseTime),
            Boolean(flight.pushBackTime),
          ].filter(Boolean).length;
          const progressPercent = Math.round((milestonesCompleted / 6) * 100);

          return (
            <div
              key={flight.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
            >
              <div>
                {/* Top strip */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black font-mono text-white">
                        {flight.flightNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {flight.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1">
                      <span>{flight.originAirport}</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                      <span>{flight.destAirport}</span>
                      <span>•</span>
                      <span>{flight.aircraftReg}</span>
                    </div>
                  </div>

                  {/* Gate Badge */}
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg block shadow-inner">
                      {flight.gate}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Stand {flight.stand}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>Turnaround Progress</span>
                    <span className="text-amber-300 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">In-Block (Chocks)</span>
                    <span className="font-bold text-slate-200">
                      {formatUtcTime(flight.chocksOnTime)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Pushback Target</span>
                    <span className="font-bold text-cyan-300">
                      {formatUtcTime(flight.targetOffBlockTime)}
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-1.5 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Captain Fuel</span>
                      <span className="font-bold text-white">
                        {flight.captainFinalFuel
                          ? `${flight.captainFinalFuel.toLocaleString()} ${flight.fuelUnit}`
                          : 'Pending Handover'}
                      </span>
                    </div>

                    {flight.fuelStatus === 'VERIFIED_BY_LC' ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> LC Confirmed
                      </span>
                    ) : flight.fuelStatus === 'DISCREPANCY' ? (
                      <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Discrepancy
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400">Awaiting LC</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onSelectFlight(flight.id, 'COVERAGE_MAN')}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Ramp Field</span>
                </button>

                <button
                  onClick={() => onSelectFlight(flight.id, 'LOAD_CONTROLLER')}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Load Control</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
