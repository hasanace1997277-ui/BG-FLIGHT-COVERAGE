import React, { useState } from 'react';
import {
  X,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { FlightTurn, FuelUnit } from '../types/aviation';

interface FuelEntryModalProps {
  flight: FlightTurn;
  operatorName: string;
  onClose: () => void;
  onSubmit: (fuelData: {
    arrivalFuel: number;
    requestedFuel: number;
    upliftFuel: number;
    captainFinalFuel: number;
    density: number;
    captainSignOff: string;
    fuelUnit: FuelUnit;
  }) => Promise<void>;
}

export const FuelEntryModal: React.FC<FuelEntryModalProps> = ({
  flight,
  operatorName,
  onClose,
  onSubmit,
}) => {
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>(flight.fuelUnit || 'KG');
  const [arrivalFuel, setArrivalFuel] = useState<string>(
    flight.arrivalFuel ? String(flight.arrivalFuel) : '10500'
  );
  const [requestedFuel, setRequestedFuel] = useState<string>(
    flight.requestedFuel ? String(flight.requestedFuel) : '48000'
  );
  const [upliftFuel, setUpliftFuel] = useState<string>(
    flight.upliftFuel ? String(flight.upliftFuel) : '37500'
  );
  const [captainFinalFuel, setCaptainFinalFuel] = useState<string>(
    flight.captainFinalFuel ? String(flight.captainFinalFuel) : '48000'
  );
  const [density, setDensity] = useState<string>(
    flight.density ? String(flight.density) : '0.803'
  );
  const [captainSignOff, setCaptainSignOff] = useState<string>(
    flight.captainSignOff || 'Capt. J. Vance'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Computations
  const numArrival = parseFloat(arrivalFuel) || 0;
  const numRequested = parseFloat(requestedFuel) || 0;
  const numUplift = parseFloat(upliftFuel) || 0;
  const numCaptain = parseFloat(captainFinalFuel) || 0;
  const numDensity = parseFloat(density) || 0.803;

  const calculatedTotal = numArrival + numUplift;
  const delta = Math.abs(calculatedTotal - numCaptain);
  const isDiscrepant = delta > 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numCaptain <= 0) {
      setErrorMsg('Please enter a valid Captain Final Fuel figure.');
      return;
    }
    if (!captainSignOff.trim()) {
      setErrorMsg('Please specify Captain sign-off name or crew ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        arrivalFuel: numArrival,
        requestedFuel: numRequested,
        upliftFuel: numUplift,
        captainFinalFuel: numCaptain,
        density: numDensity,
        captainSignOff: captainSignOff.trim(),
        fuelUnit,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit fuel figures.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Captain Fuel Telemetry Log
                <span className="text-xs font-mono bg-slate-700 text-amber-300 px-2 py-0.5 rounded">
                  {flight.flightNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Apron Coverage ➔ Central Load Controller Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Unit Toggle & Density */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] uppercase font-mono text-slate-400 font-semibold block mb-1">
                Measurement Unit
              </label>
              <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setFuelUnit('KG')}
                  className={`flex-1 py-1 rounded transition ${
                    fuelUnit === 'KG'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KG (Kilograms)
                </button>
                <button
                  type="button"
                  onClick={() => setFuelUnit('LBS')}
                  className={`flex-1 py-1 rounded transition ${
                    fuelUnit === 'LBS'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  LBS (Pounds)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-mono text-slate-400 font-semibold block mb-1">
                Fuel Density (SG)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.75"
                max="0.85"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="0.803"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Hydrant specific gravity</span>
            </div>
          </div>

          {/* Primary Figures Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Arrival / Remaining Fuel */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Arrival / Remaining Fuel ({fuelUnit})
              </label>
              <input
                type="number"
                value={arrivalFuel}
                onChange={(e) => setArrivalFuel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. 10500"
              />
              <span className="text-[10px] text-slate-400">Gauges at Touch Down / In-block</span>
            </div>

            {/* Bowser Uplift */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Bowser Fuel Uplift ({fuelUnit})
              </label>
              <input
                type="number"
                value={upliftFuel}
                onChange={(e) => setUpliftFuel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                placeholder="e.g. 37500"
              />
              <span className="text-[10px] text-slate-400">Total delivered by fuel truck meter</span>
            </div>

            {/* Requested Ramp Fuel */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Planned / Requested Ramp Fuel ({fuelUnit})
              </label>
              <input
                type="number"
                value={requestedFuel}
                onChange={(e) => setRequestedFuel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. 48000"
              />
              <span className="text-[10px] text-slate-400">Computer flight plan target</span>
            </div>

            {/* Captain's Final Figure */}
            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center justify-between">
                <span>Captain Final Figure ({fuelUnit}) *</span>
                <span className="text-[10px] text-amber-400/80 font-normal">From Cockpit</span>
              </label>
              <input
                type="number"
                value={captainFinalFuel}
                onChange={(e) => setCaptainFinalFuel(e.target.value)}
                className="w-full bg-slate-950 border-2 border-amber-500/80 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 font-black focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. 48000"
                required
              />
              <span className="text-[10px] text-slate-400">Verified by Captain on board</span>
            </div>
          </div>

          {/* Real-time Reconciliation Calculator */}
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              isDiscrepant
                ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                {isDiscrepant ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {isDiscrepant ? 'Variance Detected' : 'Reconciliation Verified'}
              </span>
              <span className="font-mono text-[11px]">
                Arrival + Uplift: {calculatedTotal.toLocaleString()} {fuelUnit}
              </span>
            </div>

            <p className="text-[11px] opacity-90 leading-relaxed">
              {isDiscrepant
                ? `Discrepancy of ${delta.toLocaleString()} ${fuelUnit} between calculated sum (${calculatedTotal.toLocaleString()}) and Captain's figure (${numCaptain.toLocaleString()}). Will flag for Load Controller review.`
                : `Cockpit figure matches calculated arrival + uplift within acceptable tolerance (${delta.toLocaleString()} ${fuelUnit} variance).`}
            </p>
          </div>

          {/* Captain Sign-off & Ramp Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Captain Name / ID *
              </label>
              <input
                type="text"
                value={captainSignOff}
                onChange={(e) => setCaptainSignOff(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. Capt. Tariq Al-Mansoor"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Coverage Officer (Transmitter)
              </label>
              <input
                type="text"
                disabled
                value={operatorName}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting...' : 'Transmit Figures to Load Control'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
