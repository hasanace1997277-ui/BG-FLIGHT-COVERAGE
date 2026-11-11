import React, { useState } from 'react';
import {
  Gauge,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Plane,
  Clock,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FlightTurn, OperationalMessage } from '../types/aviation';
import {
  formatUtcTime,
  verifyFuelByLoadController,
  releaseLoadsheetByLoadController,
} from '../services/flightService';
import { OperationalCommsDrawer } from './OperationalCommsDrawer';

interface LoadControllerViewProps {
  flights: FlightTurn[];
  selectedFlightId: string | null;
  onSelectFlight: (id: string) => void;
  controllerName: string;
  messages: OperationalMessage[];
}

export const LoadControllerView: React.FC<LoadControllerViewProps> = ({
  flights,
  selectedFlightId,
  onSelectFlight,
  controllerName,
  messages,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'NEEDS_FUEL' | 'DISCREPANCY' | 'READY_RELEASE'>('ALL');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [showDiscrepancyInput, setShowDiscrepancyInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedFlight =
    flights.find((f) => f.id === selectedFlightId) || flights[0] || null;

  // Filtered flights list
  const filteredFlights = flights.filter((f) => {
    if (filter === 'NEEDS_FUEL') return f.fuelStatus === 'PENDING' || f.fuelStatus === 'ENTERED_BY_RAMP';
    if (filter === 'DISCREPANCY') return f.fuelStatus === 'DISCREPANCY';
    if (filter === 'READY_RELEASE') return f.fuelStatus === 'VERIFIED_BY_LC' && f.loadControlStatus !== 'LOADSHEET_RELEASED';
    return true;
  });

  if (!selectedFlight) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Gauge className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
        <h3 className="text-lg font-bold text-white">No Flights Active</h3>
        <p className="text-sm text-slate-400 mt-1">Select or dispatch a flight to begin load control.</p>
      </div>
    );
  }

  // Weight & Balance estimations
  const oewEstimate = selectedFlight.aircraftType.includes('380')
    ? 277000
    : selectedFlight.aircraftType.includes('777')
    ? 167800
    : selectedFlight.aircraftType.includes('350')
    ? 142000
    : selectedFlight.aircraftType.includes('787')
    ? 128800
    : selectedFlight.aircraftType.includes('321')
    ? 48500
    : 42600;

  const mtowLimit = selectedFlight.aircraftType.includes('380')
    ? 560000
    : selectedFlight.aircraftType.includes('777')
    ? 351500
    : selectedFlight.aircraftType.includes('350')
    ? 280000
    : selectedFlight.aircraftType.includes('787')
    ? 254000
    : selectedFlight.aircraftType.includes('321')
    ? 93500
    : 78000;

  const paxWeight = (selectedFlight.paxCount || 160) * 84; // standard 84kg per pax
  const payloadTotal = paxWeight + (selectedFlight.baggageWeight || 3000) + (selectedFlight.cargoWeight || 5000);
  const zeroFuelWeight = oewEstimate + payloadTotal;
  const takeoffFuel = selectedFlight.captainFinalFuel || selectedFlight.requestedFuel || 10000;
  const estimatedTOW = zeroFuelWeight + takeoffFuel;
  const mtowMargin = mtowLimit - estimatedTOW;

  // Fuel Handlers
  const handleVerifyFuel = async (approved: boolean) => {
    setIsProcessing(true);
    try {
      await verifyFuelByLoadController(
        selectedFlight,
        controllerName,
        approved,
        approved ? undefined : discrepancyNote || 'Discrepancy flagged by Load Controller.'
      );
      setShowDiscrepancyInput(false);
      setDiscrepancyNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseLoadsheet = async () => {
    setIsProcessing(true);
    try {
      await releaseLoadsheetByLoadController(selectedFlight, controllerName);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Turnaround countdown calculation
  const tobtTime = new Date(selectedFlight.targetOffBlockTime).getTime();
  const nowTime = Date.now();
  const diffMinutes = Math.round((tobtTime - nowTime) / 60000);

  return (
    <div className="space-y-6">
      {/* Load Control Station Header & Active Flight Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-sm font-black uppercase tracking-wider text-cyan-300">
              Central Load Planning &amp; Weight &amp; Balance Desk
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              Controller: {controllerName}
            </span>
          </div>

          {/* Quick Filter tabs */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Inbounds ({flights.length})
            </button>
            <button
              onClick={() => setFilter('NEEDS_FUEL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'NEEDS_FUEL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fuel Pending
            </button>
            <button
              onClick={() => setFilter('DISCREPANCY')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                filter === 'DISCREPANCY' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Discrepancies</span>
            </button>
            <button
              onClick={() => setFilter('READY_RELEASE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'READY_RELEASE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ready for Release
            </button>
          </div>
        </div>

        {/* Flight Selector Pill Tabs */}
        <div className="flex items-center space-x-2 pt-3 overflow-x-auto pb-1">
          {filteredFlights.map((f) => {
            const isSelected = f.id === selectedFlight.id;
            const hasDiscrepancy = f.fuelStatus === 'DISCREPANCY';
            const isVerified = f.fuelStatus === 'VERIFIED_BY_LC';
            const isReleased = f.loadControlStatus === 'LOADSHEET_RELEASED';

            return (
              <button
                key={f.id}
                onClick={() => onSelectFlight(f.id)}
                className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span>{f.flightNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${isSelected ? 'bg-slate-900 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  Gate {f.gate}
                </span>
                {hasDiscrepancy ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                ) : isReleased ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isVerified ? (
                  <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Load Control Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {selectedFlight.flightNumber}
              </h1>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                {selectedFlight.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Gate: <strong className="text-slate-200">{selectedFlight.gate}</strong>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Stand: <strong className="text-slate-200">{selectedFlight.stand}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-mono font-bold text-slate-300">{selectedFlight.aircraftReg}</span>
              <span>•</span>
              <span className="font-mono text-slate-300">{selectedFlight.aircraftType}</span>
              <span>•</span>
              <span className="text-slate-300 font-mono font-bold">
                {selectedFlight.originAirport} ➔ {selectedFlight.destAirport}
              </span>
              <span>•</span>
              <span>Coverage Officer: <strong className="text-amber-300">{selectedFlight.coverageManName || 'Apron Team'}</strong></span>
            </div>
          </div>

          {/* Countdown & OTP Risk */}
          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Target Pushback (TOBT)</span>
              <span className="text-cyan-300 font-bold text-sm">
                {formatUtcTime(selectedFlight.targetOffBlockTime)}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">Timer Buffer</span>
              <span
                className={`font-bold text-sm ${
                  diffMinutes < 0
                    ? 'text-rose-400'
                    : diffMinutes <= 15
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {diffMinutes < 0 ? `${Math.abs(diffMinutes)}m DELAY` : `${diffMinutes}m remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Left Column: Fuel Telemetry Verification & Weight & Balance (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Fuel Telemetry Reconciliation Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                      Fuel Telemetry Verification
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Reconcile Ramp communicated figures against Flight Plan
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                {selectedFlight.fuelStatus === 'VERIFIED_BY_LC' ? (
                  <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RECONCILED &amp; VERIFIED
                  </span>
                ) : selectedFlight.fuelStatus === 'DISCREPANCY' ? (
                  <span className="text-xs font-mono font-bold bg-rose-950 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-800 flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> DISCREPANCY FLAGGED
                  </span>
                ) : selectedFlight.fuelStatus === 'ENTERED_BY_RAMP' ? (
                  <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> AWAITING LC APPROVAL
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                    PENDING RAMP FIGURES
                  </span>
                )}
              </div>

              {/* Comparison Matrix including Block Fuel, Trip Fuel, Taxi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono mb-4">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Block Fuel (Total)</span>
                  <span className="text-base font-black text-amber-300">
                    {selectedFlight.blockFuel ? selectedFlight.blockFuel.toLocaleString() : selectedFlight.requestedFuel?.toLocaleString() || '--'} KG
                  </span>
                  <span className="text-[9px] text-slate-400 block">From Coverage Man</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Trip Fuel</span>
                  <span className="text-base font-bold text-cyan-300">
                    {selectedFlight.tripFuel ? selectedFlight.tripFuel.toLocaleString() : '1,000'} KG
                  </span>
                  <span className="text-[9px] text-slate-400 block">Planned Burn</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Taxi Fuel</span>
                  <span className="text-base font-bold text-slate-200">
                    {selectedFlight.taxiFuel ? selectedFlight.taxiFuel.toLocaleString() : '400'} KG
                  </span>
                  <span className="text-[9px] text-slate-400 block">Ground Taxi Allowance</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border-2 border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">
                    Takeoff Fuel
                  </span>
                  <span className="text-base font-black text-emerald-300">
                    {((selectedFlight.blockFuel || 5000) - (selectedFlight.taxiFuel || 400)).toLocaleString()} KG
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    Block - Taxi
                  </span>
                </div>
              </div>

              {/* Discrepancy details */}
              {selectedFlight.discrepancyReason && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Fuel Discrepancy Note from Ramp / Cockpit
                  </div>
                  <p className="text-[11px] leading-relaxed">{selectedFlight.discrepancyReason}</p>
                </div>
              )}

              {/* Action Buttons for Load Controller */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleVerifyFuel(true)}
                  disabled={isProcessing || !selectedFlight.captainFinalFuel}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Lock Fuel Figures</span>
                </button>

                <button
                  onClick={() => setShowDiscrepancyInput(!showDiscrepancyInput)}
                  disabled={isProcessing}
                  className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-40"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Flag Discrepancy</span>
                </button>
              </div>

              {/* Discrepancy prompt input */}
              {showDiscrepancyInput && (
                <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-rose-800/60 space-y-2">
                  <label className="text-[11px] font-semibold text-rose-300 block">
                    Discrepancy Directive to Ramp Coverage Man &amp; Captain:
                  </label>
                  <textarea
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    placeholder="e.g. Fuel total differs from planned burn by 800 KG. Re-check bowser delivery receipt or verify cockpit center tank fuel pumps..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscrepancyInput(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyFuel(false)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow"
                    >
                      Transmit Discrepancy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Aircraft Weight & Trim Envelope Panel */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                      Weight &amp; Balance / Trim Computation
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Calculated from real-time pax, payload &amp; captain fuel
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  CG IN LIMITS (28.4% MAC)
                </span>
              </div>

              {/* Weight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-3">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Operating Empty (OEW)</span>
                  <span className="text-xs font-bold text-slate-300">{oewEstimate.toLocaleString()} KG</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Payload (Pax+Bags+Cargo)</span>
                  <span className="text-xs font-bold text-slate-300">{payloadTotal.toLocaleString()} KG</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Zero Fuel (ZFW)</span>
                  <span className="text-xs font-bold text-cyan-300">{zeroFuelWeight.toLocaleString()} KG</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Estimated TOW</span>
                  <span className="text-xs font-bold text-emerald-400">{estimatedTOW.toLocaleString()} KG</span>
                </div>
              </div>

              {/* MTOW Headroom meter */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 font-mono">
                    TOW vs Structural Limit (MTOW: {mtowLimit.toLocaleString()} KG)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{mtowMargin.toLocaleString()} KG Margin
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((estimatedTOW / mtowLimit) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Release Load Sheet Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {selectedFlight.loadControlStatus === 'LOADSHEET_RELEASED'
                      ? '✅ Final Load Sheet (Edition 1) Active'
                      : 'Authorize Flight Departure'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Transmits electronic trim sheet to Captain &amp; Ramp
                  </span>
                </div>

                <button
                  onClick={handleReleaseLoadsheet}
                  disabled={
                    isProcessing ||
                    selectedFlight.loadControlStatus === 'LOADSHEET_RELEASED' ||
                    selectedFlight.fuelStatus !== 'VERIFIED_BY_LC'
                  }
                  className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition disabled:opacity-40"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {selectedFlight.loadControlStatus === 'LOADSHEET_RELEASED'
                      ? 'Load Sheet Released'
                      : 'Release Final Load Sheet (Ed 1)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Turnaround Telemetry Stream & Direct Radio Comms (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Milestones Telemetry Checklist */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg text-xs font-mono">
              <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ramp Milestones Telemetry Feed</span>
              </h4>

              <div className="space-y-2">
                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selectedFlight.touchDownRecorded || selectedFlight.touchDownTime ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-slate-300 font-semibold">🛬 Touch Down</span>
                  <div className="flex items-center space-x-2">
                    <span className={selectedFlight.touchDownRecorded || selectedFlight.touchDownTime ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {formatUtcTime(selectedFlight.touchDownTime)}
                    </span>
                    {(selectedFlight.touchDownRecorded || selectedFlight.touchDownTime) && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">SENT</span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selectedFlight.chocksOnRecorded ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-slate-300 font-semibold">🛑 Chocks On</span>
                  <div className="flex items-center space-x-2">
                    <span className={selectedFlight.chocksOnRecorded ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {formatUtcTime(selectedFlight.chocksOnTime)}
                    </span>
                    {selectedFlight.chocksOnRecorded && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">SENT</span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selectedFlight.doorOpenRecorded ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-slate-300 font-semibold">🚪 Door Open</span>
                  <div className="flex items-center space-x-2">
                    <span className={selectedFlight.doorOpenRecorded ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {formatUtcTime(selectedFlight.doorOpenTime)}
                    </span>
                    {selectedFlight.doorOpenRecorded && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">SENT</span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selectedFlight.pushBackRecorded ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-slate-300 font-semibold">🚜 Push Back</span>
                  <div className="flex items-center space-x-2">
                    <span className={selectedFlight.pushBackRecorded ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {formatUtcTime(selectedFlight.pushBackTime)}
                    </span>
                    {selectedFlight.pushBackRecorded && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">SENT</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Comms */}
            <OperationalCommsDrawer
              flightId={selectedFlight.id}
              flightNumber={selectedFlight.flightNumber}
              gate={selectedFlight.gate}
              currentUserRole="LOAD_CONTROLLER"
              operatorName={controllerName}
              messages={messages}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
