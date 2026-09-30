import { useState } from 'react';
import { Header } from './components/Header';
import { PixiGame } from './components/PixiGame';
import { TelemetryBar } from './components/TelemetryBar';
import { TelemetryData } from './types/pixi-demo';
import { sound } from './utils/audio';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    deltaMS: 16.6,
    childrenCount: 0,
    pointerX: 0,
    pointerY: 0,
    rendererType: 'PixiJS v8 WebGL',
  });

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playClick();
  };

  const handleTelemetryUpdate = (data: TelemetryData) => {
    setTelemetry(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="w-full">
          <PixiGame onTelemetryUpdate={handleTelemetryUpdate} />
        </div>
      </main>

      <TelemetryBar telemetry={telemetry} />
    </div>
  );
}
