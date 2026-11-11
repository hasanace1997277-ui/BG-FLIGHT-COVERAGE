import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Server,
  FileSpreadsheet,
  Plane,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { FlightTurn } from '../types/aviation';
import { formatFourDigitTime } from '../services/flightService';

interface LoadControllerTableViewProps {
  flights: FlightTurn[];
  controllerName: string;
}

export const LoadControllerTableView: React.FC<LoadControllerTableViewProps> = ({
  flights,
  controllerName,
}) => {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Extract flight date (shown only once in Date column)
  const getFlightDate = (f: FlightTurn): string => {
    if (f.flightDate) return f.flightDate;
    if (f.scheduledArrival) return f.scheduledArrival.slice(0, 10);
    if (f.createdAt) return f.createdAt.slice(0, 10);
    return todayStr;
  };

  // Filter flights by selected date and search term
  const filteredFlights = useMemo(() => {
    return flights.filter((f) => {
      const flightDate = getFlightDate(f);
      const matchesDate = !selectedDate || flightDate === selectedDate;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        f.flightNumber.toLowerCase().includes(q) ||
        (f.aircraftReg && f.aircraftReg.toLowerCase().includes(q)) ||
        (f.captName && f.captName.toLowerCase().includes(q)) ||
        (f.crewCount && f.crewCount.toLowerCase().includes(q));

      return matchesDate && matchesSearch;
    });
  }, [flights, selectedDate, searchTerm]);

  // Export to true XLSX Excel file using SheetJS
  const handleExportXLSX = () => {
    if (filteredFlights.length === 0) {
      setExportNotice('No flight records found for this date to export.');
      setTimeout(() => setExportNotice(null), 3500);
      return;
    }

    const exportData = filteredFlights.map((f, index) => {
      const cleanTd = formatFourDigitTime(f.touchDownTime);
      const cleanCo = formatFourDigitTime(f.chocksOnTime);
      const cleanDo = formatFourDigitTime(f.doorOpenTime);
      const cleanPb = formatFourDigitTime(f.pushBackTime);

      return {
        'SL': index + 1,
        'Date': getFlightDate(f), // Date displayed ONLY here
        'Flight': f.flightNumber || 'N/A',
        'Reg': f.aircraftReg || 'N/A',
        'Capt': f.captName || f.captainSignOff || 'N/A',
        'Crew': f.crewCount || '2/5',
        'Touch Down': cleanTd !== '--' ? cleanTd : '',
        'Chocks On': cleanCo !== '--' ? cleanCo : '',
        'Door Open': cleanDo !== '--' ? cleanDo : '',
        'Push Back': cleanPb !== '--' ? cleanPb : '',
        'Block Fuel': f.blockFuel ?? (f.captainFinalFuel ?? ''),
        'Trip Fuel': f.tripFuel ?? '',
        'Taxi': f.taxiFuel ?? '',
        'Fuel Status': f.fuelStatus === 'ENTERED_BY_RAMP' || f.fuelSentAt ? 'SENT' : 'PENDING',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Column widths
    worksheet['!cols'] = [
      { wch: 6 },  // SL
      { wch: 13 }, // Date (only once)
      { wch: 18 }, // Flight
      { wch: 12 }, // Reg
      { wch: 18 }, // Capt
      { wch: 10 }, // Crew (e.g. 2/5)
      { wch: 13 }, // Touch Down (0000 format)
      { wch: 13 }, // Chocks On (0000 format)
      { wch: 13 }, // Door Open (0000 format)
      { wch: 13 }, // Push Back (0000 format)
      { wch: 14 }, // Block Fuel
      { wch: 13 }, // Trip Fuel
      { wch: 10 }, // Taxi
      { wch: 14 }, // Fuel Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Turnaround_${selectedDate}`);

    XLSX.writeFile(workbook, `Flight_Coverage_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner for Load Controller */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white tracking-wide">
                Load Controller Operational Table
              </h1>
              <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Server className="w-3.5 h-3.5" />
                  Live Server Telemetry Active
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Read-Only Mode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector & Download XLSX */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-inner">
            <Calendar className="w-4 h-4 text-blue-500 mr-2 shrink-0" />
            <span className="text-xs font-mono text-slate-500 mr-1.5 uppercase font-semibold">
              Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportXLSX}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            title="Download formatted Excel (.xlsx) file for selected date"
          >
            <Download className="w-4 h-4" />
            <span>Download XLSX File</span>
          </button>
        </div>
      </div>

      {/* Export notification banner */}
      {exportNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-amber-400 hover:text-white ml-2 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span>Date <strong>{selectedDate}</strong> records:</span>
          <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
            {filteredFlights.length} Flights
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flight, reg, capt..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* The Master Flight Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Flight</th>
                <th className="py-3 px-3">Reg</th>
                <th className="py-3 px-3">Capt</th>
                <th className="py-3 px-3">Crew</th>
                <th className="py-3 px-3 text-center">Touch Down</th>
                <th className="py-3 px-3 text-center">Chocks On</th>
                <th className="py-3 px-3 text-center">Door Open</th>
                <th className="py-3 px-3 text-right">Block Fuel</th>
                <th className="py-3 px-3 text-right">Trip Fuel</th>
                <th className="py-3 px-3 text-right">Taxi</th>
                <th className="py-3 px-3 text-center">Push Back</th>
                <th className="py-3 px-3 text-center">Fuel Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <Plane className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                    No flight records found for date {selectedDate}.
                    <br />
                    <span className="text-[11px] text-slate-500">
                      Timings and fuel sent by Coverage Man will update here in real time.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredFlights.map((f) => {
                  const cleanTd = formatFourDigitTime(f.touchDownTime);
                  const cleanCo = formatFourDigitTime(f.chocksOnTime);
                  const cleanDo = formatFourDigitTime(f.doorOpenTime);
                  const cleanPb = formatFourDigitTime(f.pushBackTime);

                  const isTouchDownGreen = Boolean(f.touchDownRecorded || (cleanTd && cleanTd !== '--'));
                  const isChocksGreen = Boolean(f.chocksOnRecorded || (cleanCo && cleanCo !== '--'));
                  const isDoorOpenGreen = Boolean(f.doorOpenRecorded || (cleanDo && cleanDo !== '--'));
                  const isPushBackGreen = Boolean(f.pushBackRecorded || (cleanPb && cleanPb !== '--'));

                  const hasFuel = f.blockFuel !== undefined || f.fuelStatus === 'ENTERED_BY_RAMP';

                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Date (Only displayed once here!) */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {getFlightDate(f)}
                      </td>

                      {/* Flight Number */}
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {f.flightNumber}
                      </td>

                      {/* Aircraft Reg */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-bold uppercase whitespace-nowrap">
                        {f.aircraftReg || '--'}
                      </td>

                      {/* Capt (AFTER REG) */}
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                        {f.captName || f.captainSignOff || '--'}
                      </td>

                      {/* Crew (AFTER CAPT, e.g. 2/5) */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                        {f.crewCount || '2/5'}
                      </td>

                      {/* Touch Down (Strictly 0000 format, NO date) */}
                      <td className="py-3 px-3 text-center">
                        {cleanTd && cleanTd !== '--' ? (
                          <span
                            className={`px-2.5 py-1 rounded font-bold font-mono tracking-widest ${
                              isTouchDownGreen
                                ? 'bg-[#6aa84f] text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cleanTd}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      {/* Chocks On (Strictly 0000 format, NO date) */}
                      <td className="py-3 px-3 text-center">
                        {cleanCo && cleanCo !== '--' ? (
                          <span
                            className={`px-2.5 py-1 rounded font-bold font-mono tracking-widest ${
                              isChocksGreen
                                ? 'bg-[#6aa84f] text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cleanCo}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      {/* Door Open (Strictly 0000 format, NO date) */}
                      <td className="py-3 px-3 text-center">
                        {cleanDo && cleanDo !== '--' ? (
                          <span
                            className={`px-2.5 py-1 rounded font-bold font-mono tracking-widest ${
                              isDoorOpenGreen
                                ? 'bg-[#6aa84f] text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cleanDo}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      {/* Block Fuel */}
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white font-mono">
                        {f.blockFuel !== undefined
                          ? f.blockFuel.toLocaleString()
                          : f.captainFinalFuel !== undefined
                          ? f.captainFinalFuel.toLocaleString()
                          : '--'}
                      </td>

                      {/* Trip Fuel */}
                      <td className="py-3 px-3 text-right font-semibold text-blue-600 dark:text-blue-400 font-mono">
                        {f.tripFuel !== undefined ? f.tripFuel.toLocaleString() : '--'}
                      </td>

                      {/* Taxi Fuel */}
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-mono">
                        {f.taxiFuel !== undefined ? f.taxiFuel.toLocaleString() : '--'}
                      </td>

                      {/* Push Back (Strictly 0000 format, NO date) */}
                      <td className="py-3 px-3 text-center">
                        {cleanPb && cleanPb !== '--' ? (
                          <span
                            className={`px-2.5 py-1 rounded font-bold font-mono tracking-widest ${
                              isPushBackGreen
                                ? 'bg-[#6aa84f] text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cleanPb}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      {/* Fuel Status */}
                      <td className="py-3 px-3 text-center">
                        {hasFuel ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
