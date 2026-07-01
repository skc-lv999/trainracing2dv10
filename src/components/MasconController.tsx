import React, { useEffect, useCallback } from "react";
import { MasconState } from "../types.js";
import { Zap, Gauge, Keyboard } from "lucide-react";

interface MasconControllerProps {
  currentNotch: MasconState;
  setNotch: (notch: MasconState) => void;
  speed: number;
  acceleration: number; // m/s2 or positive/negative rate
  atcLimit: number;
}

const NOTCH_LIST: MasconState[] = ["P4", "P3", "P2", "P1", "N", "B1", "B2", "B3", "EB"];

export const MasconController: React.FC<MasconControllerProps> = ({
  currentNotch,
  setNotch,
  speed,
  acceleration,
  atcLimit
}) => {
  // Keyboard listeners removed - handled globally in App.tsx for ultra-responsiveness

  // Color mapping per notch category
  const getNotchColor = (notch: MasconState) => {
    if (notch.startsWith("P")) return "bg-emerald-500 border-emerald-400 text-emerald-950 shadow-emerald-500/50";
    if (notch === "N") return "bg-amber-500 border-amber-400 text-amber-950 shadow-amber-500/50";
    if (notch.startsWith("B")) return "bg-amber-600 border-amber-500 text-amber-100 shadow-amber-600/50";
    return "bg-rose-600 border-rose-500 text-rose-100 shadow-rose-600/50"; // EB
  };

  const getNotchLabel = (notch: MasconState) => {
    if (notch === "P4") return "P4 (全加速)";
    if (notch === "P3") return "P3";
    if (notch === "P2") return "P2";
    if (notch === "P1") return "P1";
    if (notch === "N") return "N (惰行)";
    if (notch === "B1") return "B1";
    if (notch === "B2") return "B2";
    if (notch === "B3") return "B3";
    return "EB (非常)";
  };

  const isSpeedOverLimit = speed > atcLimit;

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col md:flex-row gap-4 max-w-5xl mx-auto text-slate-100 selection:bg-indigo-500">
      
      {/* 1. Left Side: Dynamic Cab Instrument Cluster */}
      <div className="flex-[3] grid grid-cols-2 gap-3">
        {/* Speedometer (Analog digital combo) */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
            <span className="text-[10px] font-mono text-cyan-405 flex items-center gap-1 font-bold">
              <Gauge className="w-3.5 h-3.5" /> SPEED
            </span>
            <span className="text-[9px] bg-cyan-900/40 text-cyan-300 font-mono px-1 rounded font-black">ATC CONTROL</span>
          </div>
          <div className="py-2 text-center z-10">
            <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-405 tracking-tight">
              {Math.round(speed)}
              <span className="text-xs font-bold text-cyan-600 ml-1">KM/H</span>
            </div>
          </div>
          <div className="w-full bg-slate-850 h-2 rounded overflow-hidden mt-1">
            <div 
              className="bg-cyan-405 h-full transition-all duration-100"
              style={{ width: `${Math.min(100, (speed / 130) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* ATC SIGNAL (Replacing MOTOR LOAD) */}
        <div className={`border rounded-lg p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
          isSpeedOverLimit 
            ? "bg-rose-950/85 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse" 
            : "bg-slate-950 border-slate-800 shadow-inner"
        }`}>
          <div className="flex justify-between items-center w-full z-10">
            <span className={`text-[10px] font-mono flex items-center gap-1 font-bold tracking-wider ${
              isSpeedOverLimit ? "text-rose-400" : "text-amber-400"
            }`}>
              <Zap className={`w-3.5 h-3.5 ${isSpeedOverLimit ? "text-rose-400 animate-bounce" : "text-amber-450"}`} /> ATC SIGNAL
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
              isSpeedOverLimit 
                ? "bg-rose-800 text-white animate-pulse" 
                : "bg-yellow-950 text-yellow-400"
            }`}>
              {isSpeedOverLimit ? "LIMIT OVER" : "ATC ACTIVE"}
            </span>
          </div>

          <div className="py-1 text-center z-10">
            <div className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
              isSpeedOverLimit ? "text-rose-400" : "text-yellow-450"
            }`}>
              {atcLimit}
              <span className="text-xs font-bold ml-1 opacity-70">KM/H</span>
            </div>
            <div className={`text-[8.5px] font-sans font-semibold mt-0.5 ${
              isSpeedOverLimit ? "text-rose-300" : "text-slate-400"
            }`}>
              {isSpeedOverLimit ? "⚠️ 速度制限超過！自動ブレーキ作動" : "現在の区間制限速度"}
            </div>
          </div>

          {/* Bar indicator: current speed relative to limit */}
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden z-10 mt-1">
            <div 
              className={`h-full transition-all duration-150 ${
                isSpeedOverLimit ? "bg-rose-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(100, (speed / atcLimit) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Right Side: Interactive Mascon Lever HUD - Compact Horizontal buttons bar */}
      <div className="flex-[5] bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400 border-b border-slate-900 pb-1.5 mb-3">
          <span className="flex items-center gap-1 text-slate-200 font-bold">
            <Keyboard className="w-4 h-4 text-indigo-400 animate-pulse" /> MASTER CONTROLLER LEVER
          </span>
          <span className="text-slate-400 text-[9px] font-medium">操作：W/S (P4〜EB), Space (非常ブレーキ)</span>
        </div>

        {/* 2.1 Mechanical Sliding Handle Guide Track */}
        <div className="relative w-full h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-4 mb-3 overflow-hidden select-none">
          {/* Physical mechanical slot groove */}
          <div className="absolute left-4 right-4 h-2 bg-slate-950 rounded-full border border-slate-800 shadow-inner" />
          
          {/* Indicators and notches tick marks in background */}
          <div className="absolute left-4 right-4 inset-y-0 flex justify-between items-center pointer-events-none">
            {NOTCH_LIST.map((notch) => {
              const isSelected = currentNotch === notch;
              return (
                <div key={notch} className="flex flex-col items-center justify-center relative w-6 h-full">
                  <div className={`w-1 transition-all duration-300 ${isSelected ? 'h-3 bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'h-1.5 bg-slate-700'}`} />
                  <span className={`text-[8.5px] font-black font-mono transition-colors duration-300 mt-1 ${isSelected ? 'text-white font-black' : 'text-slate-500'}`}>
                    {notch}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sliding Mechanical Lever Handle */}
          <div className="absolute left-4 right-4 inset-y-0 pointer-events-none">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 -ml-4 flex items-center justify-center transition-all duration-300 ease-out z-10"
              style={{ 
                left: `${(NOTCH_LIST.indexOf(currentNotch || "N") / (NOTCH_LIST.length - 1)) * 100}%` 
              }}
            >
              {/* Mechanical Metallic Circular Knob with dynamic notch category color */}
              <div className={`w-7 h-7 rounded-full border-2 border-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center justify-center font-mono text-[9px] font-black tracking-tight cursor-pointer transform hover:scale-110 active:scale-95 transition-transform duration-100 ${
                (currentNotch || "N").startsWith("P") 
                  ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/30" 
                  : (currentNotch || "N") === "N" 
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30" 
                    : (currentNotch || "N").startsWith("B") 
                      ? "bg-amber-600 text-white border-amber-400 shadow-amber-600/30" 
                      : "bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-600/50"
              }`}>
                {currentNotch || "N"}
              </div>
              {/* Mechanical lever arm underneath */}
              <div className="absolute top-full -mt-0.5 w-1 h-2 bg-slate-400 border border-slate-600" />
            </div>
          </div>
        </div>

        {/* 2.2 Master horizontal notch buttons track */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
          {NOTCH_LIST.map((notch) => {
            const isSelected = currentNotch === notch;
            return (
              <button
                key={notch}
                id={`mascon-notch-${notch}`}
                onClick={() => setNotch(notch)}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg border transition-all cursor-pointer text-xs font-mono font-black ${
                  isSelected 
                    ? `${getNotchColor(notch)} border-white ring-2 ring-white/20 scale-105 shadow-[0_0_12px_rgba(255,255,255,0.15)]`
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span>{getNotchLabel(notch)}</span>
              </button>
            );
          })}
        </div>

        {/* Tactical advice - Compact single line */}
        <div className="mt-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded px-2 py-1 text-[9px] text-indigo-300 font-mono text-center">
          💡 速度制限(⚠️)が見えたらブレーキをかけ、制限超過5秒停止ペナルティを回避しましょう！
        </div>
      </div>

    </div>
  );
};
export default MasconController;
