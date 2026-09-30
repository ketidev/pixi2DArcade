import React from 'react';
import { TelemetryData } from '../types/pixi-demo';
import { Activity, Layers, MousePointer, Cpu } from 'lucide-react';

interface TelemetryBarProps {
  telemetry: TelemetryData;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 font-mono tabular-nums">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>FPS:</span>
          <span className="font-semibold text-emerald-300">
            {Math.round(telemetry.fps || 60)}
          </span>
          <span className="text-slate-500 text-[11px]">({telemetry.deltaMS.toFixed(1)}ms)</span>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stage ელემენტები:</span>
          <span className="font-semibold text-cyan-300">{telemetry.childrenCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <MousePointer className="w-3.5 h-3.5 text-amber-400" />
          <span>Pointer:</span>
          <span className="font-semibold text-amber-300">
            X:{Math.round(telemetry.pointerX)} Y:{Math.round(telemetry.pointerY)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Engine:</span>
        <span className="text-indigo-300 font-medium">{telemetry.rendererType || 'PixiJS v8 WebGL'}</span>
      </div>
    </div>
  );
};
