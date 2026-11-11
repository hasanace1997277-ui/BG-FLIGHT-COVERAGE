import React, { useState } from 'react';
import { X, Plane, Plus, Calendar, Clock } from 'lucide-react';
import { FlightTurn, FuelUnit } from '../types/aviation';

interface NewFlightModalProps {
  onClose: () => void;
  onSubmit: (flightData: Omit<FlightTurn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  defaultOrigin?: string;
}

export const NewFlightModal: React.FC<NewFlightModalProps> = ({
  onClose,
  onSubmit,
  defaultOrigin = 'LHR',
}) => {
  const [flightNumber, setFlightNumber] = useState('BG148/11NOV26');
  const [aircraftReg, setAircraftReg] = useState('S2-ALD');
  const [captName, setCaptName] = useState('Capt. Vance');
  const [crewCount, setCrewCount] = useState('2/5');
  const [crewName, setCrewName] = useState('Capt. Vance (2/5)');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().slice(0, 10));
  const [aircraftType, setAircraftType] = useState('B777-300ER');
  const [originAirport, setOriginAirport] = useState('LHR');
  const [destAirport, setDestAirport] = useState('DAC');
  const [gate, setGate] = useState('B18');
  const [stand, setStand] = useState('S26');
  const [mgt, setMgt] = useState('55');
  const [requestedFuel, setRequestedFuel] = useState('5000');
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>('KG');
  const [paxCount, setPaxCount] = useState('288');
  const [cargoWeight, setCargoWeight] = useState('12400');
  const [baggageWeight, setBaggageWeight] = useState('6100');

  const now = new Date();
  const formatTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [schedArr, setSchedArr] = useState(formatTime(new Date(now.getTime() - 10 * 60000)));
  const [schedDep, setSchedDep] = useState(formatTime(new Date(now.getTime() + 50 * 60000)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim() || !aircraftReg.trim()) {
      setErrorMsg('Please specify flight number and aircraft registration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const arrIso = new Date(schedArr).toISOString();
      const depIso = new Date(schedDep).toISOString();

      await onSubmit({
        flightNumber: flightNumber.trim().toUpperCase(),
        aircraftReg: aircraftReg.trim().toUpperCase(),
        captName: captName.trim(),
        crewCount: crewCount.trim(),
        crewName: `${captName.trim()} (${crewCount.trim()})`,
        flightDate,
        aircraftType,
        originAirport: originAirport.trim().toUpperCase(),
        destAirport: destAirport.trim().toUpperCase(),
        gate: gate.trim().toUpperCase(),
        stand: stand.trim().toUpperCase(),
        status: 'SCHEDULED',
        scheduledArrival: arrIso,
        scheduledDeparture: depIso,
        targetOffBlockTime: depIso,
        minimumGroundTimeMinutes: parseInt(mgt) || 45,
        touchDownTime: '',
        chocksOnTime: '',
        doorOpenTime: '',
        pushBackTime: '',
        blockFuel: parseFloat(requestedFuel) || 0,
        tripFuel: 0,
        taxiFuel: 0,
        fuelUnit,
        requestedFuel: parseFloat(requestedFuel) || 0,
        fuelStatus: 'PENDING',
        loadControlStatus: 'PENDING_FUEL',
        coverageManName: 'Apron Coverage Officer',
        loadControllerName: 'Central Load Planner',
        delayMinutes: 0,
        paxCount: parseInt(paxCount) || 0,
        cargoWeight: parseFloat(cargoWeight) || 0,
        baggageWeight: parseFloat(baggageWeight) || 0,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch flight.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden my-6">
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Dispatch New Inbound Flight</h2>
              <p className="text-xs text-slate-400">
                Initialize turnaround coverage schedule and telemetry feed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* Flight Identifiers */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Flight No. *
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                placeholder="QR 416"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                A/C Reg *
              </label>
              <input
                type="text"
                value={aircraftReg}
                onChange={(e) => setAircraftReg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                placeholder="A7-BEE"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                A/C Type
              </label>
              <select
                value={aircraftType}
                onChange={(e) => setAircraftType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="B777-300ER">B777-300ER</option>
                <option value="A350-900">A350-900</option>
                <option value="A380-800">A380-800</option>
                <option value="B787-9">B787-9</option>
                <option value="A321neo">A321neo</option>
                <option value="A320-200">A320-200</option>
                <option value="B737-800">B737-800</option>
              </select>
            </div>
          </div>

          {/* Capt & Crew */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Capt Name
              </label>
              <input
                type="text"
                value={captName}
                onChange={(e) => setCaptName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Capt. Vance"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Crew Ratio (e.g. 2/5)
              </label>
              <input
                type="text"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="2/5"
              />
            </div>
          </div>

          {/* Route & Stand */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Origin
              </label>
              <input
                type="text"
                value={originAirport}
                onChange={(e) => setOriginAirport(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Dest
              </label>
              <input
                type="text"
                value={destAirport}
                onChange={(e) => setDestAirport(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Gate
              </label>
              <input
                type="text"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold uppercase text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Stand
              </label>
              <input
                type="text"
                value={stand}
                onChange={(e) => setStand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase text-center"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Scheduled In (STA)
              </label>
              <input
                type="datetime-local"
                value={schedArr}
                onChange={(e) => setSchedArr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Scheduled Out (STD)
              </label>
              <input
                type="datetime-local"
                value={schedDep}
                onChange={(e) => setSchedDep(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                required
              />
            </div>
          </div>

          {/* Operations & Fuel */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Planned Ramp Fuel
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={requestedFuel}
                  onChange={(e) => setRequestedFuel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-l-lg px-2.5 py-1.5 text-xs font-mono text-amber-300"
                />
                <button
                  type="button"
                  onClick={() => setFuelUnit(fuelUnit === 'KG' ? 'LBS' : 'KG')}
                  className="bg-slate-800 border-y border-r border-slate-700 px-2 text-[10px] font-mono text-slate-300 rounded-r-lg font-bold"
                >
                  {fuelUnit}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Min Ground Time (MGT)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={mgt}
                  onChange={(e) => setMgt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-l-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
                <span className="bg-slate-800 border-y border-r border-slate-700 px-2 py-1.5 text-[10px] font-mono text-slate-400 rounded-r-lg">
                  MIN
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Pax Booked
              </label>
              <input
                type="number"
                value={paxCount}
                onChange={(e) => setPaxCount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Turnaround'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
