import React, { useState } from 'react';
import { X, Clock, Check, AlertCircle } from 'lucide-react';
import { FlightTurn } from '../types/aviation';
import { formatUtcTime } from '../services/flightService';

interface MilestoneModalProps {
  flight: FlightTurn;
  milestoneKey: 'touchDown' | 'chocksOn' | 'doorOpen' | 'doorClose' | 'pushBack';
  onClose: () => void;
  onConfirm: (isoTime: string) => Promise<void>;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  flight,
  milestoneKey,
  onClose,
  onConfirm,
}) => {
  const getMilestoneTitle = () => {
    switch (milestoneKey) {
      case 'touchDown':
        return 'Touch Down (ALDT - Actual Landing)';
      case 'chocksOn':
        return 'Chocks On (AIBT - Actual In-Block)';
      case 'doorOpen':
        return 'Cabin Doors Open (Deboarding Started)';
      case 'doorClose':
        return 'Cabin Doors Closed (Cabin Secure)';
      case 'pushBack':
        return 'Push Back (AOBT - Actual Off-Block)';
    }
  };

  const getExistingTime = () => {
    switch (milestoneKey) {
      case 'touchDown':
        return flight.touchDownTime;
      case 'chocksOn':
        return flight.chocksOnTime;
      case 'doorOpen':
        return flight.doorOpenTime;
      case 'doorClose':
        return flight.doorCloseTime;
      case 'pushBack':
        return flight.pushBackTime;
    }
  };

  const initialDate = getExistingTime() ? new Date(getExistingTime()!) : new Date();

  // Prepare input values (local representation for datetime-local picker)
  const formatForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [inputVal, setInputVal] = useState<string>(formatForInput(initialDate));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyOffset = (offsetMinutes: number) => {
    const target = new Date(Date.now() + offsetMinutes * 60000);
    setInputVal(formatForInput(target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedDate = new Date(inputVal);
      await onConfirm(parsedDate.toISOString());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/80 px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Record Milestone Timestamp</h3>
              <p className="text-[11px] text-slate-400">
                {flight.flightNumber} • Gate {flight.gate} / Stand {flight.stand}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Operational Milestone
            </label>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs font-bold text-emerald-400">
              {getMilestoneTitle()}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
              Quick Timing Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyOffset(0)}
                className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold text-center transition"
              >
                NOW (0m)
              </button>
              <button
                type="button"
                onClick={() => applyOffset(-2)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold text-center transition"
              >
                -2 min
              </button>
              <button
                type="button"
                onClick={() => applyOffset(-5)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold text-center transition"
              >
                -5 min
              </button>
              <button
                type="button"
                onClick={() => applyOffset(-10)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold text-center transition"
              >
                -10 min
              </button>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Timestamp (Local Device / UTC Converted)
            </label>
            <input
              type="datetime-local"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              UTC Equivalent:{' '}
              <strong className="text-cyan-300">
                {formatUtcTime(new Date(inputVal).toISOString())}
              </strong>
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging...' : 'Confirm & Log Timestamp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
