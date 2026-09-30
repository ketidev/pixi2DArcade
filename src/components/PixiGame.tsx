import { Pause, Play, RotateCcw, Shield, Sparkles, Zap } from 'lucide-react';
import { Application, Container, FederatedPointerEvent, Graphics, Text, TextStyle } from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import { GameState, PixiGameProps } from '../types/pixi-demo';
import { sound } from '../utils/audio';

export const PixiGame: React.FC<PixiGameProps> = ({ onTelemetryUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('pixi_high_score') || '0', 10);
  });
  const [combo, setCombo] = useState<number>(1);
  const [shield, setShield] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(45);

  const gameStateRef = useRef<GameState>('TITLE_MENU');
  gameStateRef.current = gameState;

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const comboRef = useRef(1);
  comboRef.current = combo;

  const shieldRef = useRef(100);
  shieldRef.current = shield;

  const timeLeftRef = useRef(45);
  timeLeftRef.current = timeLeft;

  // Key tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    let isCancelled = false;
    let app: Application | null = null;

    const initPixi = async () => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.parentElement?.getBoundingClientRect();
      const width = Math.floor(rect?.width || 800);
      const height = 500;

      app = new Application();
      await app.init({
        canvas: canvasRef.current,
        width,
        height,
        backgroundColor: 0x070b14,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (isCancelled) {
        app.destroy(true, { children: true });
        return;
      }

      appRef.current = app;

      // Master Layers
      const bgLayer = new Container();
      const gameLayer = new Container();
      const effectsLayer = new Container();
      const uiLayer = new Container();

      app.stage.addChild(bgLayer);
      app.stage.addChild(gameLayer);
      app.stage.addChild(effectsLayer);
      app.stage.addChild(uiLayer);

      // 1. Starry cosmic background
      const stars: { x: number; y: number; speed: number; gfx: Graphics }[] = [];
      for (let i = 0; i < 70; i++) {
        const star = new Graphics();
        const r = Math.random() * 1.5 + 0.5;
        star.circle(0, 0, r).fill({ color: 0xffffff, alpha: Math.random() * 0.7 + 0.3 });
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        star.position.set(sx, sy);
        bgLayer.addChild(star);
        stars.push({ x: sx, y: sy, speed: Math.random() * 0.4 + 0.1, gfx: star });
      }

      // 2. Player Vessel Container
      const player = new Container();
      player.position.set(width / 2, height / 2);

      // Player visual ship
      const shipGfx = new Graphics();
      // Fuselage
      shipGfx.poly([0, -22, 16, 14, 0, 8, -16, 14]).fill(0x0284c7).stroke({ width: 2, color: 0x38bdf8 });
      // Cockpit glowing core
      shipGfx.circle(0, 2, 4).fill(0x34d399);
      // Wing energy lines
      shipGfx.moveTo(-12, 10).lineTo(-4, 0).stroke({ width: 1.5, color: 0x67e8f9 });
      shipGfx.moveTo(12, 10).lineTo(4, 0).stroke({ width: 1.5, color: 0x67e8f9 });

      // Engine Thruster
      const thrusterGfx = new Graphics();
      thrusterGfx.poly([-5, 9, 0, 20, 5, 9]).fill({ color: 0x38bdf8, alpha: 0.8 });

      player.addChild(thrusterGfx);
      player.addChild(shipGfx);
      gameLayer.addChild(player);

      // Shield Aura
      const shieldGfx = new Graphics();
      shieldGfx.circle(0, 0, 26).stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.6 });
      player.addChild(shieldGfx);

      // Game state entities
      const items: GemItem[] = [];
      const sparks: SparkItem[] = [];
      const floatingTexts: FloatingTextItem[] = [];

      let targetX = width / 2;
      let targetY = height / 2;
      let pointerDown = false;
      let lastSpawn = 0;
      let lastSecond = Date.now();
      let comboTimer = 0;

      // Handle pointer events on canvas
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        pointerDown = true;
        targetX = e.global.x;
        targetY = e.global.y;
      });

      app.stage.on('pointermove', (e: FederatedPointerEvent) => {
        targetX = e.global.x;
        targetY = e.global.y;
      });

      window.addEventListener('pointerup', () => {
        pointerDown = false;
      });

      // Spawn items helper
      const spawnItem = () => {
        if (items.length >= 14) return;
        const typeRand = Math.random();
        const type: 'gem' | 'orb' | 'hazard' = typeRand < 0.55 ? 'gem' : typeRand < 0.8 ? 'orb' : 'hazard';

        const itemContainer = new Container();
        const gfx = new Graphics();

        let radius = 14;
        let points = 100;

        if (type === 'gem') {
          radius = 12;
          points = 100;
          gfx.star(0, 0, 5, 14, 7).fill(0xf59e0b).stroke({ width: 1.5, color: 0xfef08a });
        } else if (type === 'orb') {
          radius = 16;
          points = 250;
          gfx.circle(0, 0, 14).fill({ color: 0x8b5cf6, alpha: 0.85 }).stroke({ width: 2, color: 0xc4b5fd });
          gfx.circle(0, 0, 6).fill(0xffffff);
        } else {
          radius = 15;
          points = -150;
          gfx.poly([-12, -10, 10, -14, 15, 6, 4, 14, -14, 8])
            .fill(0xef4444)
            .stroke({ width: 2, color: 0xfca5a5 });
        }

        itemContainer.addChild(gfx);

        // Spawn along perimeter
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;
        if (side === 0) { sx = Math.random() * width; sy = -20; }
        else if (side === 1) { sx = width + 20; sy = Math.random() * height; }
        else if (side === 2) { sx = Math.random() * width; sy = height + 20; }
        else { sx = -20; sy = Math.random() * height; }

        const angle = Math.atan2(height / 2 - sy, width / 2 - sx) + (Math.random() - 0.5) * 0.8;
        const speed = type === 'hazard' ? Math.random() * 1.5 + 1.2 : Math.random() * 1.2 + 0.8;

        itemContainer.position.set(sx, sy);
        gameLayer.addChild(itemContainer);

        items.push({
          container: itemContainer,
          gfx,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotSpeed: (Math.random() - 0.5) * 0.06,
          type,
          radius,
          points,
        });
      };

      // Spawn floating score text
      const createScorePopup = (text: string, x: number, y: number, color: string) => {
        const textObj = new Text({
          text,
          style: new TextStyle({
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            fontWeight: 'bold',
            fill: color,
            stroke: { color: 0x000000, width: 3 },
          }),
        });
        textObj.anchor.set(0.5);
        textObj.position.set(x, y);
        effectsLayer.addChild(textObj);
        floatingTexts.push({
          textObj,
          vy: -1.6,
          alpha: 1,
          life: 0,
        });
      };

      // Particle explosion
      const createExplosion = (x: number, y: number, color: number, count = 12) => {
        for (let i = 0; i < count; i++) {
          const spark = new Graphics();
          const r = Math.random() * 2 + 1;
          spark.circle(0, 0, r).fill(color);
          spark.position.set(x, y);
          effectsLayer.addChild(spark);

          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3.5 + 1;
          sparks.push({
            gfx: spark,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
          });
        }
      };

      // Ticker Loop
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;

        // Telemetry update
        onTelemetryUpdate({
          fps: ticker.FPS,
          deltaMS: ticker.deltaMS,
          childrenCount: app!.stage.children.reduce((acc, c) => acc + (c as Container).children.length, 0),
          pointerX: targetX,
          pointerY: targetY,
          rendererType: 'PixiJS v8 WebGL Ticker',
        });

        // Background stars drifting
        for (const s of stars) {
          s.y += s.speed * delta;
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
          s.gfx.position.set(s.x, s.y);
        }

        if (gameStateRef.current !== 'PLAYING') {
          // Idle floating for player on menu
          player.rotation += 0.01 * delta;
          thrusterGfx.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.3;
          return;
        }

        // Time tracking
        const now = Date.now();
        if (now - lastSecond >= 1000) {
          lastSecond = now;
          if (timeLeftRef.current > 0) {
            const nextTime = timeLeftRef.current - 1;
            setTimeLeft(nextTime);
            if (nextTime <= 0) {
              setGameState('GAME_OVER');
            }
          }
        }

        // Keyboard control fallback
        if (keysRef.current['ArrowUp'] || keysRef.current['w']) targetY -= 6 * delta;
        if (keysRef.current['ArrowDown'] || keysRef.current['s']) targetY += 6 * delta;
        if (keysRef.current['ArrowLeft'] || keysRef.current['a']) targetX -= 6 * delta;
        if (keysRef.current['ArrowRight'] || keysRef.current['d']) targetX += 6 * delta;

        // Constrain target within bounds
        targetX = Math.max(20, Math.min(width - 20, targetX));
        targetY = Math.max(20, Math.min(height - 20, targetY));

        // Smooth Lerp movement
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        player.x += dx * 0.12 * delta;
        player.y += dy * 0.12 * delta;

        // Rotate player ship towards cursor
        if (Math.hypot(dx, dy) > 4) {
          const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
          // Smooth angular interpolation
          let diff = targetAngle - player.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          player.rotation += diff * 0.2 * delta;
          thrusterGfx.scale.y = 1.3 + Math.random() * 0.5;
        } else {
          thrusterGfx.scale.y = 0.8;
        }

        // Pulse shield aura
        shieldGfx.alpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;

        // Periodic spawn
        lastSpawn += delta;
        if (lastSpawn > 45) {
          lastSpawn = 0;
          spawnItem();
        }

        // Update items & collisions
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.x += item.vx * delta;
          item.y += item.vy * delta;
          item.container.position.set(item.x, item.y);
          item.gfx.rotation += item.rotSpeed * delta;

          // Check distance to player
          const dist = Math.hypot(item.x - player.x, item.y - player.y);
          if (dist < item.radius + 18) {
            // Collision occurred!
            if (item.type === 'gem' || item.type === 'orb') {
              const currentCombo = comboRef.current;
              const pts = item.points * currentCombo;
              const newScore = scoreRef.current + pts;
              setScore(newScore);

              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('pixi_high_score', newScore.toString());
              }

              // Sound & combo
              sound.playCollect(1 + currentCombo * 0.1);
              if (currentCombo > 1) {
                sound.playCombo(currentCombo);
              }

              const nextCombo = Math.min(5, currentCombo + 1);
              setCombo(nextCombo);
              comboTimer = 180; // 3 seconds to chain

              createScorePopup(
                `+${pts}${currentCombo > 1 ? ` (x${currentCombo})` : ''}`,
                item.x,
                item.y,
                item.type === 'gem' ? '#f59e0b' : '#a855f7'
              );
              createExplosion(item.x, item.y, item.type === 'gem' ? 0xf59e0b : 0x8b5cf6, 14);
            } else {
              // Hazard hit!
              sound.playHit();
              const nextShield = Math.max(0, shieldRef.current - 25);
              setShield(nextShield);
              setCombo(1);

              createScorePopup('-25 SHIELD', item.x, item.y, '#ef4444');
              createExplosion(item.x, item.y, 0xef4444, 20);

              if (nextShield <= 0) {
                setGameState('GAME_OVER');
              }
            }

            // Remove from stage
            gameLayer.removeChild(item.container);
            item.container.destroy({ children: true });
            items.splice(i, 1);
            continue;
          }

          // Off-screen cleanup
          if (item.x < -60 || item.x > width + 60 || item.y < -60 || item.y > height + 60) {
            gameLayer.removeChild(item.container);
            item.container.destroy({ children: true });
            items.splice(i, 1);
          }
        }

        // Combo decay timer
        if (comboTimer > 0) {
          comboTimer -= delta;
          if (comboTimer <= 0 && comboRef.current > 1) {
            setCombo(1);
          }
        }

        // Update sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.x += sp.vx * delta;
          sp.y += sp.vy * delta;
          sp.alpha -= sp.decay * delta;
          sp.gfx.position.set(sp.x, sp.y);
          sp.gfx.alpha = Math.max(0, sp.alpha);

          if (sp.alpha <= 0) {
            effectsLayer.removeChild(sp.gfx);
            sp.gfx.destroy();
            sparks.splice(i, 1);
          }
        }

        // Update floating score texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          const ft = floatingTexts[i];
          ft.textObj.y += ft.vy * delta;
          ft.alpha -= 0.02 * delta;
          ft.textObj.alpha = Math.max(0, ft.alpha);
          ft.life += delta;

          if (ft.alpha <= 0) {
            effectsLayer.removeChild(ft.textObj);
            ft.textObj.destroy();
            floatingTexts.splice(i, 1);
          }
        }
      });
    };

    // Keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    initPixi();

    return () => {
      isCancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  const handleStartGame = () => {
    sound.playClick();
    setScore(0);
    setCombo(1);
    setShield(100);
    setTimeLeft(45);
    setGameState('PLAYING');
  };

  const handleTogglePause = () => {
    sound.playClick();
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Top HUD Overlay */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">ქულა (Score)</span>
            <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">რეკორდი (Best)</span>
            <span className="text-base font-bold font-mono text-slate-300 tabular-nums">
              {highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">კომბო</span>
            <div className="flex items-center gap-1 font-mono font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className={`text-base ${combo > 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                x{combo}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Shield bar */}
          <div className="flex flex-col items-end min-w-[120px]">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>ფარი: {shield}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  shield > 50 ? 'bg-cyan-400' : shield > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${shield}%` }}
              />
            </div>
          </div>

          {/* Time Remaining */}
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-slate-400 font-medium">დრო</span>
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-slate-200'
              }`}
            >
              {timeLeft}s
            </span>
          </div>

          {/* Game Controls */}
          {gameState === 'PLAYING' && (
            <button
              onClick={handleTogglePause}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Pixi Canvas */}
      <div className="relative w-full h-[500px] bg-slate-950 flex items-center justify-center cursor-crosshair">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Title Screen Overlay */}
        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-7 h-7" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Cosmic Spark: Pixi Arcade</h1>
            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              Pixi.js v8-ზე აგებული 2D არკადული თამაში. ამოძრავეთ ხომალდი მაუსით ან WASD ღილაკებით, შეაგროვეთ
              ენერგიის კრისტალები და აარიდეთ თავი წითელ ასტეროიდებს.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mb-8 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                ოქროს ვარსკვლავი: +100
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                კვანტური ბირთვი: +250
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                ასტეროიდი: -25 ფარი
              </span>
            </div>

            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>თამაშის დაწყება</span>
            </button>
          </div>
        )}

        {/* Paused Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <h2 className="text-2xl font-bold text-white mb-4">თამაში დაპაუზებულია</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePause}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>გაგრძელება</span>
              </button>
              <button
                onClick={handleStartGame}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>თავიდან დაწყება</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-xs text-rose-400 font-mono tracking-wider mb-1">MISSON COMPLETE</span>
            <h2 className="text-3xl font-bold text-white mb-2">რაუნდი დასრულდა!</h2>

            <div className="my-6 p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-[240px]">
              <span className="text-xs text-slate-400 block mb-1">საბოლოო ქულა</span>
              <span className="text-3xl font-bold font-mono text-cyan-300">{score.toLocaleString()}</span>
              {score >= highScore && score > 0 && (
                <span className="block text-xs font-semibold text-amber-400 mt-1">ახალი რეკორდი! 🏆</span>
              )}
            </div>

            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>კიდევ ერთხელ თამაში</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
