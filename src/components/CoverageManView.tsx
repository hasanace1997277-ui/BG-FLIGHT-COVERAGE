import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Plane,
  Server,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { FlightTurn } from '../types/aviation';
import {
  getCurrentHhmm,
  formatFourDigitTime,
  updateFlightTimingSimple,
  sendFuelFiguresSimple,
  updateFlightDetailsSimple,
} from '../services/flightService';

interface CoverageManViewProps {
  flights: FlightTurn[];
  selectedFlightId: string | null;
  onSelectFlight: (id: string) => void;
  onOpenNewFlight: () => void;
  onDeleteFlight: (id: string) => Promise<void>;
}

export const CoverageManView: React.FC<CoverageManViewProps> = ({
  flights,
  selectedFlightId,
  onSelectFlight,
  onOpenNewFlight,
  onDeleteFlight,
}) => {
  const selectedFlight =
    flights.find((f) => f.id === selectedFlightId) || flights[0] || null;

  // Local state for inputs in exact order
  const [flightNumber, setFlightNumber] = useState('BG147/11NOV26');
  const [touchDownTime, setTouchDownTime] = useState('2210');
  const [chocksOnTime, setChocksOnTime] = useState('2220');
  const [doorOpenTime, setDoorOpenTime] = useState('2222');
  const [aircraftReg, setAircraftReg] = useState('S2-ALC');
  const [captName, setCaptName] = useState('Capt. Vance');
  const [crewCount, setCrewCount] = useState('2/5');
  const [pushBackTime, setPushBackTime] = useState('2350');

  const [touchDownActive, setTouchDownActive] = useState(true);
  const [chocksOnActive, setChocksOnActive] = useState(false);
  const [doorOpenActive, setDoorOpenActive] = useState(false);
  const [pushBackActive, setPushBackActive] = useState(false);

  const [blockFuel, setBlockFuel] = useState<string>('5000');
  const [tripFuel, setTripFuel] = useState<string>('1000');
  const [taxiFuel, setTaxiFuel] = useState<string>('400');

  const [fuelSentFeedback, setFuelSentFeedback] = useState(false);
  const [serverSyncMsg, setServerSyncMsg] = useState<string | null>(null);

  // In-app deletion state (avoids browser confirm() which is blocked in iframes)
  const [flightToDelete, setFlightToDelete] = useState<{ id: string; flightNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when selectedFlight changes or updates from Firestore server
  useEffect(() => {
    if (selectedFlight) {
      setFlightNumber(selectedFlight.flightNumber || 'BG147/11NOV26');
      setAircraftReg(selectedFlight.aircraftReg || 'S2-ALC');
      setCaptName(selectedFlight.captName || selectedFlight.captainSignOff || 'Capt. Vance');
      setCrewCount(selectedFlight.crewCount || '2/5');

      // Strictly format to 4 digits 0000 format (e.g. 2210)
      const cleanTd = formatFourDigitTime(selectedFlight.touchDownTime);
      const cleanCo = formatFourDigitTime(selectedFlight.chocksOnTime);
      const cleanDo = formatFourDigitTime(selectedFlight.doorOpenTime);
      const cleanPb = formatFourDigitTime(selectedFlight.pushBackTime);

      setTouchDownTime(cleanTd !== '--' ? cleanTd : '2210');
      setChocksOnTime(cleanCo !== '--' ? cleanCo : '2220');
      setDoorOpenTime(cleanDo !== '--' ? cleanDo : '2222');
      setPushBackTime(cleanPb !== '--' ? cleanPb : '2350');

      setTouchDownActive(Boolean(selectedFlight.touchDownRecorded ?? selectedFlight.touchDownTime));
      setChocksOnActive(Boolean(selectedFlight.chocksOnRecorded));
      setDoorOpenActive(Boolean(selectedFlight.doorOpenRecorded));
      setPushBackActive(Boolean(selectedFlight.pushBackRecorded));

      if (selectedFlight.blockFuel !== undefined) {
        setBlockFuel(String(selectedFlight.blockFuel));
      } else if (selectedFlight.captainFinalFuel !== undefined) {
        setBlockFuel(String(selectedFlight.captainFinalFuel));
      }
      if (selectedFlight.tripFuel !== undefined) {
        setTripFuel(String(selectedFlight.tripFuel));
      }
      if (selectedFlight.taxiFuel !== undefined) {
        setTaxiFuel(String(selectedFlight.taxiFuel));
      }
    }
  }, [selectedFlight]);

  if (!selectedFlight) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Plane className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
        <h3 className="text-lg font-bold text-white">No Flights Scheduled</h3>
        <button
          onClick={onOpenNewFlight}
          className="mt-4 px-4 py-2 bg-[#ea7e31] text-black font-bold rounded-lg text-xs"
        >
          Create First Flight
        </button>
      </div>
    );
  }

  // Handler for Milestone buttons (turns green and sends 0000 timing to server)
  const handleMilestonePress = async (
    key: 'touchDown' | 'chocksOn' | 'doorOpen' | 'pushBack'
  ) => {
    let currentVal = '';
    const nowTime = getCurrentHhmm(); // 4 digits 0000 e.g. 2200

    if (key === 'touchDown') {
      currentVal = touchDownTime || nowTime;
      setTouchDownTime(currentVal);
      setTouchDownActive(true);
    } else if (key === 'chocksOn') {
      currentVal = chocksOnTime || nowTime;
      setChocksOnTime(currentVal);
      setChocksOnActive(true);
    } else if (key === 'doorOpen') {
      currentVal = doorOpenTime || nowTime;
      setDoorOpenTime(currentVal);
      setDoorOpenActive(true);
    } else if (key === 'pushBack') {
      currentVal = pushBackTime || nowTime;
      setPushBackTime(currentVal);
      setPushBackActive(true);
    }

    try {
      await updateFlightTimingSimple(selectedFlight.id, key, currentVal);
      showSyncToast(`${key.toUpperCase()} (${currentVal}) saved to server!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler for Send Fuel button
  const handleSendFuel = async () => {
    const numBlock = parseFloat(blockFuel) || 0;
    const numTrip = parseFloat(tripFuel) || 0;
    const numTaxi = parseFloat(taxiFuel) || 0;

    try {
      await sendFuelFiguresSimple(selectedFlight.id, numBlock, numTrip, numTaxi);
      setFuelSentFeedback(true);
      showSyncToast(
        `Fuel saved & sent to Load Controller: Block: ${numBlock}, Trip: ${numTrip}, Taxi: ${numTaxi}`
      );
      setTimeout(() => setFuelSentFeedback(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const showSyncToast = (msg: string) => {
    setServerSyncMsg(msg);
    setTimeout(() => setServerSyncMsg(null), 3500);
  };

  // Handle Flight details blur (Flight No, Reg, Capt, Crew)
  const handleDetailsBlur = async () => {
    try {
      await updateFlightDetailsSimple(selectedFlight.id, {
        flightNumber,
        aircraftReg,
        captName,
        crewCount,
        crewName: `${captName} (${crewCount})`,
      });
      showSyncToast('Flight details updated on server.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 min-h-[80vh]">
      {/* Flight selector pill row */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-mono text-slate-400 uppercase mr-1">Active Flight:</span>
        {flights.map((f) => {
          const isSelected = f.id === selectedFlight.id;
          return (
            <div key={f.id} className="inline-flex items-center">
              <button
                onClick={() => onSelectFlight(f.id)}
                className={`px-3 py-1.5 rounded-l-lg text-xs font-bold font-mono transition border-y border-l cursor-pointer ${
                  isSelected
                    ? 'bg-[#ea7e31] text-black border-orange-400 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {f.flightNumber}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlightToDelete({ id: f.id, flightNumber: f.flightNumber });
                }}
                className={`px-1.5 py-1.5 rounded-r-lg border-y border-r transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#d96a1e] text-black border-orange-400 hover:bg-rose-600 hover:text-white'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-rose-600 hover:text-white'
                }`}
                title={`Delete ${f.flightNumber}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        <button
          onClick={onOpenNewFlight}
          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold font-mono transition cursor-pointer"
          title="Add another flight for today"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Flight</span>
        </button>
        <button
          onClick={() => {
            setFlightToDelete({ id: selectedFlight.id, flightNumber: selectedFlight.flightNumber });
          }}
          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold font-mono transition cursor-pointer"
          title="Delete current flight"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Current Flight</span>
        </button>
      </div>

      {/* In-app Delete Confirmation Modal (never uses blocked window.confirm) */}
      {flightToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600/70 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Flight</h3>
                <p className="text-xs text-rose-400 font-mono font-bold">
                  {flightToDelete.flightNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
              Are you sure you want to permanently delete flight{' '}
              <strong className="text-white font-mono">{flightToDelete.flightNumber}</strong> from the server?
              This will remove all turnaround timings, fuel records, and telemetry from both Coverage Man and Load Controller views.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFlightToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteFlight(flightToDelete.id);
                    setFlightToDelete(null);
                  } catch (err) {
                    console.error('Delete error in modal:', err);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Flight'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Server Sync Indicator */}
      <div className="mb-4 flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3.5 py-1 rounded-full shadow-inner">
        <Server className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Connected to Server • Coverage Man Edit Mode</span>
      </div>

      {/* Server sync alert toast */}
      {serverSyncMsg && (
        <div className="mb-4 bg-emerald-600 text-white font-mono text-xs px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2 transition animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{serverSyncMsg}</span>
        </div>
      )}

      {/* THE BASIC AND SIMPLE 2-COLUMN RECTANGULAR INTERFACE IN CHRONOLOGICAL ORDER */}
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 space-y-3.5">
        
        {/* ROW 1: Flight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Flight
          </div>
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            onBlur={handleDetailsBlur}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono tracking-wide"
            placeholder="BG147/11NOV26"
          />
        </div>

        {/* ROW 2: Touch Down */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleMilestonePress('touchDown')}
            className={`w-full py-3.5 px-2 text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm transition active:scale-95 cursor-pointer select-none ${
              touchDownActive ? 'bg-[#6aa84f]' : 'bg-[#ea7e31] hover:brightness-105'
            }`}
            title="Press to mark Touch Down and send timing to server"
          >
            Touch Down
          </button>
          <input
            type="text"
            maxLength={4}
            value={touchDownTime}
            onChange={(e) => setTouchDownTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => handleMilestonePress('touchDown')}
            className={`w-full py-3.5 px-2 text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono tracking-widest focus:outline-none focus:ring-2 ${
              touchDownActive
                ? 'bg-[#6aa84f] focus:ring-green-300'
                : 'bg-[#4271c7] focus:ring-blue-300'
            }`}
            placeholder="2210"
          />
        </div>

        {/* ROW 3: Chocks On */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleMilestonePress('chocksOn')}
            className={`w-full py-3.5 px-2 text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm transition active:scale-95 cursor-pointer select-none ${
              chocksOnActive ? 'bg-[#6aa84f]' : 'bg-[#ea7e31] hover:brightness-105'
            }`}
            title="Press to mark Chocks On and send timing to server"
          >
            Chocks On
          </button>
          <input
            type="text"
            maxLength={4}
            value={chocksOnTime}
            onChange={(e) => setChocksOnTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => handleMilestonePress('chocksOn')}
            className={`w-full py-3.5 px-2 text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono tracking-widest focus:outline-none focus:ring-2 ${
              chocksOnActive
                ? 'bg-[#6aa84f] focus:ring-green-300'
                : 'bg-[#4271c7] focus:ring-blue-300'
            }`}
            placeholder="2220"
          />
        </div>

        {/* ROW 4: Door Open */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleMilestonePress('doorOpen')}
            className={`w-full py-3.5 px-2 text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm transition active:scale-95 cursor-pointer select-none ${
              doorOpenActive ? 'bg-[#6aa84f]' : 'bg-[#ea7e31] hover:brightness-105'
            }`}
            title="Press to mark Door Open and send timing to server"
          >
            Door Open
          </button>
          <input
            type="text"
            maxLength={4}
            value={doorOpenTime}
            onChange={(e) => setDoorOpenTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => handleMilestonePress('doorOpen')}
            className={`w-full py-3.5 px-2 text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono tracking-widest focus:outline-none focus:ring-2 ${
              doorOpenActive
                ? 'bg-[#6aa84f] focus:ring-green-300'
                : 'bg-[#4271c7] focus:ring-blue-300'
            }`}
            placeholder="2222"
          />
        </div>

        {/* ROW 5: Capt */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Capt
          </div>
          <input
            type="text"
            value={captName}
            onChange={(e) => setCaptName(e.target.value)}
            onBlur={handleDetailsBlur}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-sans tracking-wide"
            placeholder="Capt. Vance"
          />
        </div>

        {/* ROW 6: Crew (e.g. 2/5) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Crew
          </div>
          <input
            type="text"
            value={crewCount}
            onChange={(e) => setCrewCount(e.target.value)}
            onBlur={handleDetailsBlur}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono tracking-wide"
            placeholder="2/5"
          />
        </div>

        {/* ROW 7: Reg */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Reg
          </div>
          <input
            type="text"
            value={aircraftReg}
            onChange={(e) => setAircraftReg(e.target.value)}
            onBlur={handleDetailsBlur}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono uppercase tracking-wide"
            placeholder="S2-ALC"
          />
        </div>

        {/* ROW 8: Block Fuel */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Block Fuel
          </div>
          <input
            type="number"
            value={blockFuel}
            onChange={(e) => setBlockFuel(e.target.value)}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="5000"
          />
        </div>

        {/* ROW 9: Trip Fuel */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Trip Fuel
          </div>
          <input
            type="number"
            value={tripFuel}
            onChange={(e) => setTripFuel(e.target.value)}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="1000"
          />
        </div>

        {/* ROW 10: Taxi */}
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full py-3.5 px-2 bg-[#ea7e31] text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm select-none">
            Taxi
          </div>
          <input
            type="number"
            value={taxiFuel}
            onChange={(e) => setTaxiFuel(e.target.value)}
            className="w-full py-3.5 px-2 bg-[#4271c7] text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="400"
          />
        </div>

        {/* ROW 11: Push Back (Chronological out-block) */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleMilestonePress('pushBack')}
            className={`w-full py-3.5 px-2 text-black font-semibold text-base sm:text-lg flex items-center justify-center rounded-none shadow-sm transition active:scale-95 cursor-pointer select-none ${
              pushBackActive ? 'bg-[#6aa84f]' : 'bg-[#ea7e31] hover:brightness-105'
            }`}
            title="Press to mark Push Back and send timing to server"
          >
            Push Back
          </button>
          <input
            type="text"
            maxLength={4}
            value={pushBackTime}
            onChange={(e) => setPushBackTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => handleMilestonePress('pushBack')}
            className={`w-full py-3.5 px-2 text-white font-semibold text-base sm:text-lg text-center rounded-none shadow-sm font-mono tracking-widest focus:outline-none focus:ring-2 ${
              pushBackActive
                ? 'bg-[#6aa84f] focus:ring-green-300'
                : 'bg-[#4271c7] focus:ring-blue-300'
            }`}
            placeholder="2350"
          />
        </div>

        {/* ROW 12: SEND FUEL Button */}
        <div className="pt-3 flex justify-center">
          <button
            type="button"
            onClick={handleSendFuel}
            className={`w-[190px] py-3.5 px-4 text-black font-bold text-base sm:text-lg rounded-none shadow-md transition active:scale-95 cursor-pointer uppercase tracking-wider ${
              fuelSentFeedback
                ? 'bg-[#6aa84f] text-white flex items-center justify-center gap-1.5'
                : 'bg-[#ea7e31] hover:brightness-105'
            }`}
          >
            {fuelSentFeedback ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>SENT!</span>
              </>
            ) : (
              'SEND FUEL'
            )}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 text-center max-w-sm font-mono">
        Timings entered in 0000 format (e.g. 2200). Press orange buttons to turn green and transmit to Load Controller.
      </p>
    </div>
  );
};
