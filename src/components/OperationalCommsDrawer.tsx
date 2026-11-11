import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Radio,
  User,
  Shield,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OperationalMessage, UserRole } from '../types/aviation';
import { sendOperationalMessage, formatUtcTime } from '../services/flightService';

interface OperationalCommsProps {
  flightId: string;
  flightNumber: string;
  gate: string;
  currentUserRole: UserRole;
  operatorName: string;
  messages: OperationalMessage[];
}

export const OperationalCommsDrawer: React.FC<OperationalCommsProps> = ({
  flightId,
  flightNumber,
  gate,
  currentUserRole,
  operatorName,
  messages,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const toSend = messageText || text;
    if (!toSend.trim()) return;

    setIsSending(true);
    try {
      const senderRole = currentUserRole === 'COVERAGE_MAN' ? 'COVERAGE_MAN' : 'LOAD_CONTROLLER';
      await sendOperationalMessage(
        flightId,
        senderRole,
        operatorName,
        toSend.trim(),
        toSend.includes('Fuel') ? 'FUEL_ALERT' : 'CHAT'
      );
      if (!messageText) setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const RAMP_PRESETS = [
    '⛽ Captain confirmed fuel figures handed over',
    '🚪 Deplaning completed, cabin cleaning started',
    '👥 Passenger boarding commenced',
    '⚠️ 4 bags offload in progress (no-show pax)',
    '🚜 Tug connected & bypass pin inserted. Ready for pushback',
  ];

  const LC_PRESETS = [
    '✅ Fuel figures acknowledged. Calculating trim.',
    '📋 Load Sheet Edition 1 released to cockpit',
    '⚠️ Hold pushback: Cargo door discrepancy check',
    '🎯 Target Off-Block Time (TOBT) confirmed on schedule',
  ];

  const activePresets = currentUserRole === 'COVERAGE_MAN' ? RAMP_PRESETS : LC_PRESETS;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[580px]">
      {/* Header */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Ramp ⇄ Load Control Comms</span>
              <span className="font-mono text-[10px] text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">
                {flightNumber}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Gate {gate} • Instant Operations Dispatch Channel</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Messages list */}
          <div ref={scrollRef} className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[220px] max-h-[340px]">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                No messages yet on this flight dispatch channel.
                <br />
                <span className="text-[11px] text-slate-400">
                  Telemetry updates and captain fuel notes will stream here in real time.
                </span>
              </div>
            ) : (
              messages.map((msg) => {
                const isRamp = msg.senderRole === 'COVERAGE_MAN';
                const isLC = msg.senderRole === 'LOAD_CONTROLLER';
                const isSys = msg.senderRole === 'SYSTEM';

                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs transition border ${
                      isSys
                        ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                        : isRamp
                        ? 'bg-amber-950/30 border-amber-800/40 text-amber-100'
                        : 'bg-cyan-950/30 border-cyan-800/40 text-cyan-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                      <span className="font-bold flex items-center gap-1">
                        {isRamp && <span className="text-amber-400">👷 RAMP [COVERAGE]</span>}
                        {isLC && <span className="text-cyan-400">🎧 LOAD CONTROL [OCC]</span>}
                        {isSys && <span className="text-emerald-400">⚡ SYSTEM TELEMETRY</span>}
                        <span className="text-slate-400 font-sans ml-1">• {msg.senderName}</span>
                      </span>
                      <span className="text-slate-400">{formatUtcTime(msg.timestamp)}</span>
                    </div>
                    <p className="leading-relaxed font-sans text-xs">{msg.message}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Dispatch Presets */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Quick Operational Radio Transmits</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(preset)}
                  disabled={isSending}
                  className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md border border-slate-700 transition active:scale-95 text-left truncate max-w-full"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                currentUserRole === 'COVERAGE_MAN'
                  ? 'Message Load Control (e.g. Fuel uplift status, bags, doors)...'
                  : 'Message Ramp Coverage Man (e.g. Fuel verified, hold boarding)...'
              }
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={isSending || !text.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition active:scale-95 disabled:opacity-40 shadow-sm"
              title="Transmit"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
