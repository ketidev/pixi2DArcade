import { Gamepad2, Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import { HeaderProps } from '../types/pixi-demo';

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Gamepad2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white">
            PixiJS 2D Arcade
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'ხმის გამორთვა' : 'ხმის ჩართვა'}
          className={`p-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
            soundEnabled
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600'
              : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">{soundEnabled ? 'ხმა' : 'მუნჯი'}</span>
        </button>
      </div>
    </header>
  );
};
