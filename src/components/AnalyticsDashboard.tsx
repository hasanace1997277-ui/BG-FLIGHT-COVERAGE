import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Plane,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { FlightTurn } from '../types/aviation';
import {
  computeTurnaroundMetrics,
  formatUtcTime,
  formatUtcDateTime,
} from '../services/flightService';

interface AnalyticsDashboardProps {
  flights: FlightTurn[];
  station: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  flights,
  station,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE' | 'DISCREPANCY'>('ALL');

  const metrics = computeTurnaroundMetrics(flights);

  // Filtered flights for the reporting table
  const filteredFlights = flights.filter((f) => {
    const matchesSearch =
      f.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.aircraftReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.gate.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'COMPLETED') return f.status === 'PUSHED_BACK' || f.status === 'DEPARTED';
    if (selectedFilter === 'ACTIVE') return f.status !== 'PUSHED_BACK' && f.status !== 'DEPARTED';
    if (selectedFilter === 'DISCREPANCY') return f.fuelStatus === 'DISCREPANCY';
    return true;
  });

  // Export to CSV generator
  const exportToCsv = () => {
    const headers = [
      'Flight Number',
      'Aircraft Reg',
      'Aircraft Type',
      'Origin',
      'Destination',
      'Gate',
      'Stand',
      'Status',
      'Scheduled In (STA)',
      'Touch Down (ALDT)',
      'Chocks On (AIBT)',
      'Door Open',
      'Door Close',
      'Push Back (AOBT)',
      'Scheduled Out (STD)',
      'Target Off Block (TOBT)',
      'Fuel Unit',
      'Arrival Fuel',
      'Requested Fuel',
      'Bowser Uplift',
      'Captain Final Fuel',
      'Fuel Density',
      'Captain Sign-Off',
      'Fuel Status',
      'Delay Minutes',
      'Delay Code',
      'Coverage Officer',
      'Load Controller',
    ];

    const rows = filteredFlights.map((f) => [
      f.flightNumber,
      f.aircraftReg,
      f.aircraftType,
      f.originAirport,
      f.destAirport,
      f.gate,
      f.stand,
      f.status,
      f.scheduledArrival,
      f.touchDownTime || '',
      f.chocksOnTime || '',
      f.doorOpenTime || '',
      f.doorCloseTime || '',
      f.pushBackTime || '',
      f.scheduledDeparture,
      f.targetOffBlockTime,
      f.fuelUnit,
      f.arrivalFuel || '',
      f.requestedFuel || '',
      f.upliftFuel || '',
      f.captainFinalFuel || '',
      f.density || '',
      `"${f.captainSignOff || ''}"`,
      f.fuelStatus,
      f.delayMinutes || 0,
      f.delayReasonCode || '',
      `"${f.coverageManName || ''}"`,
      `"${f.loadControllerName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aeroturn_ops_report_${station}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header & Export Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-black font-mono text-white tracking-wide">
              Turnaround Performance &amp; Efficiency Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Station Hub: <strong className="text-emerald-400 font-mono">{station}</strong> • Real-time operational data logging from cloud database
          </p>
        </div>

        <button
          onClick={exportToCsv}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Turnaround Report (CSV)</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: OTP D15 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            On-Time Punctuality (D15)
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {metrics.onTimePerformanceRate}%
            </span>
            <span className="text-[10px] text-emerald-400/80 font-bold">Target &gt;85%</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Scheduled departure variance</span>
        </div>

        {/* Card 2: Average Ground Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            Avg Ground Turn Time
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black font-mono text-cyan-400">
              {metrics.averageGroundTimeMinutes}m
            </span>
            <span className="text-[10px] text-slate-400">Chocks to Push</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Minimum Ground Time aligned</span>
        </div>

        {/* Card 3: Taxi-In Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            Avg Taxi-In Time
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black font-mono text-amber-300">
              {metrics.averageTaxiInMinutes}m
            </span>
            <span className="text-[10px] text-slate-400">TD ➔ Chocks</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Runway to Stand transit</span>
        </div>

        {/* Card 4: Door Open Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            Door Open Latency
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black font-mono text-indigo-400">
              {metrics.averageDoorOpenLatencyMinutes}m
            </span>
            <span className="text-[10px] text-slate-400">Chocks ➔ Door</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Deboarding readiness</span>
        </div>

        {/* Card 5: Fuel Discrepancy Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            Fuel Discrepancies
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`text-2xl font-black font-mono ${
                metrics.fuelDiscrepancyCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {metrics.fuelDiscrepancyCount}
            </span>
            <span className="text-[10px] text-slate-400">Flagged</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">&gt;300 KG/LBS variance</span>
        </div>

        {/* Card 6: Active Turns */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
            Turnaround Volume
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black font-mono text-white">
              {metrics.totalFlights}
            </span>
            <span className="text-[10px] text-slate-400">
              ({metrics.activeTurnarounds} Active)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics.completedTurns} completed today
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Turnaround Milestone Phase Breakdown Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Turnaround Phase Duration Distribution</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Average time spent per phase across active and departed aircraft
          </p>

          <div className="space-y-3.5">
            {/* Phase 1 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">1. Runway Taxi-In (Touch Down ➔ Chocks On)</span>
                <span className="font-mono font-bold text-amber-300">{metrics.averageTaxiInMinutes} min</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.averageTaxiInMinutes / 45) * 100)}%` }}
                />
              </div>
            </div>

            {/* Phase 2 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">2. Jetbridge / Stairs Connection (Chocks ➔ Door Open)</span>
                <span className="font-mono font-bold text-indigo-400">{metrics.averageDoorOpenLatencyMinutes} min</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.averageDoorOpenLatencyMinutes / 45) * 100)}%` }}
                />
              </div>
            </div>

            {/* Phase 3 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">3. Cabin Servicing, Catering &amp; Boarding (Door Open ➔ Close)</span>
                <span className="font-mono font-bold text-cyan-400">
                  {Math.max(25, metrics.averageGroundTimeMinutes - metrics.averageDoorOpenLatencyMinutes - 5)} min
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all"
                  style={{ width: '75%' }}
                />
              </div>
            </div>

            {/* Phase 4 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">4. Pushback Clearance &amp; Tug Operation (Door Close ➔ Pushback)</span>
                <span className="font-mono font-bold text-emerald-400">5 min</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: '18%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Fuel Telemetry Accuracy & Planned vs Actual Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200 mb-1 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Captain Fuel Telemetry Accuracy Matrix</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Planned Ramp Fuel vs Captain Final Stated Figures across logged flights
          </p>

          <div className="space-y-3">
            {flights.slice(0, 5).map((f) => {
              const planned = f.requestedFuel || 0;
              const actual = f.captainFinalFuel || planned;
              const diff = actual - planned;
              const hasDiff = Math.abs(diff) > 0;

              return (
                <div key={f.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5 font-mono">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>{f.flightNumber}</span>
                      <span className="text-slate-400 font-normal">({f.aircraftReg})</span>
                    </span>
                    <span className="text-slate-400 font-sans text-[11px]">
                      Planned: <strong className="text-slate-200">{planned.toLocaleString()} {f.fuelUnit}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">Captain Stated:</span>
                      <span className="font-bold text-emerald-400">
                        {actual.toLocaleString()} {f.fuelUnit}
                      </span>
                    </div>

                    <div className="text-[11px]">
                      {hasDiff ? (
                        <span className={diff > 0 ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                          {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} {f.fuelUnit}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Exact Match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flight Turnaround Reporting & Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Operational Flight Turn Logs &amp; Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Complete historical record of Touch Down, Chocks, Doors, Pushback, and Captain fuel figures
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search flight, reg, gate..."
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono w-48"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedFilter === 'ACTIVE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedFilter === 'COMPLETED' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Departed
              </button>
              <button
                onClick={() => setSelectedFilter('DISCREPANCY')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedFilter === 'DISCREPANCY' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                Discrepancies
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Flight</th>
                <th className="py-2.5 px-3">Type &amp; Reg</th>
                <th className="py-2.5 px-3">Gate / Stand</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Touch Down (ALDT)</th>
                <th className="py-2.5 px-3">Chocks On (AIBT)</th>
                <th className="py-2.5 px-3">Door Open</th>
                <th className="py-2.5 px-3">Door Close</th>
                <th className="py-2.5 px-3">Push Back (AOBT)</th>
                <th className="py-2.5 px-3">Captain Fuel</th>
                <th className="py-2.5 px-3">Load Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No matching flights found.
                  </td>
                </tr>
              ) : (
                filteredFlights.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-white">{f.flightNumber}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{f.aircraftReg}</div>
                      <div className="text-[10px] text-slate-400">{f.aircraftType}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-amber-300 font-bold">{f.gate}</span>
                      <span className="text-slate-400 ml-1">({f.stand})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-400">
                      {formatUtcTime(f.touchDownTime)}
                    </td>
                    <td className="py-3 px-3 text-emerald-400">
                      {formatUtcTime(f.chocksOnTime)}
                    </td>
                    <td className="py-3 px-3 text-cyan-300">
                      {formatUtcTime(f.doorOpenTime)}
                    </td>
                    <td className="py-3 px-3 text-cyan-300">
                      {formatUtcTime(f.doorCloseTime)}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold">
                      {formatUtcTime(f.pushBackTime)}
                    </td>
                    <td className="py-3 px-3">
                      {f.captainFinalFuel ? (
                        <div>
                          <span className="font-bold text-white">
                            {f.captainFinalFuel.toLocaleString()} {f.fuelUnit}
                          </span>
                          <div className="text-[9px] text-slate-400 truncate max-w-[120px]">
                            {f.captainSignOff}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {f.loadControlStatus === 'LOADSHEET_RELEASED' ? (
                        <span className="text-emerald-400 text-[10px] font-bold">
                          Ed 1 Released
                        </span>
                      ) : f.fuelStatus === 'VERIFIED_BY_LC' ? (
                        <span className="text-cyan-300 text-[10px]">Fuel Verified</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Awaiting Fuel</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
