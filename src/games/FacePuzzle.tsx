import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface Piece {
  id: number;
  currentSlot: number;
  image: HTMLCanvasElement;
  drawX: number;
  drawY: number;
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

class Player {
  id: number;
  bounds: { x: number, y: number, w: number, h: number };
  color: string;
  state: 'CALIBRATING' | 'WAITING' | 'PLAYING' | 'SOLVED' | 'LOSE' = 'CALIBRATING';
  box: { x: number, y: number, w: number, h: number } | null = null;
  pieces: Piece[] = [];
  slots: Slot[] = [];
  heldPieceIndex: number = -1;
  startTime: number | null = null;
  elapsedTime: number = 0;
  intervalId: any = null;
  isPinching: boolean = false;

  constructor(id: number, bounds: any, color: string) {
    this.id = id;
    this.bounds = bounds;
    this.color = color;
  }

  getDistance(p1: any, p2: any) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  formatTime(seconds: number) {
    let m = Math.floor(seconds / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  snapToSlot(piece: Piece) {
    let slot = this.slots[piece.currentSlot];
    piece.drawX = slot.x;
    piece.drawY = slot.y;
  }

  shufflePuzzle() {
    let slotIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = slotIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slotIndices[i], slotIndices[j]] = [slotIndices[j], slotIndices[i]];
    }
    this.pieces.forEach((p, index) => {
      p.currentSlot = slotIndices[index];
      this.snapToSlot(p);
    });
  }

  startPlaying() {
    this.state = 'PLAYING';
    this.startTime = Date.now();
    this.intervalId = setInterval(() => {
      if (this.startTime) this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }
}

interface FacePuzzleProps {
  onBack: () => void;
}

const FacePuzzle: React.FC<FacePuzzleProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'WIN'>('MENU');
  const [mode, setMode] = useState<'single' | 'multi' | null>(null);
  const [camStatus, setCamStatus] = useState<'IDLE' | 'LOADING' | 'ACTIVE'>('IDLE');
  const [winnerPlayer, setWinnerPlayer] = useState<Player | null>(null);

  const playersRef = useRef<Player[]>([]);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const gameLoopRef = useRef<number | null>(null);

  const PINCH_THRESHOLD = 60;

  const capturePuzzle = (player: Player) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !player.box) return;

    let imageData = ctx.getImageData(player.box.x, player.box.y, player.box.w, player.box.h);
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = player.box.w;
    tempCanvas.height = player.box.h;
    tempCanvas.getContext('2d')?.putImageData(imageData, 0, 0);

    let pieceW = player.box.w / 3;
    let pieceH = player.box.h / 3;
    player.pieces = [];
    player.slots = [];

    for (let i = 0; i < 9; i++) {
      let row = Math.floor(i / 3);
      let col = i % 3;
      let pX = player.box.x + col * pieceW;
      let pY = player.box.y + row * pieceH;
      player.slots.push({ x: pX, y: pY, w: pieceW, h: pieceH });
      let pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = pieceW;
      pieceCanvas.height = pieceH;
      pieceCanvas.getContext('2d')?.drawImage(tempCanvas, col * pieceW, row * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
      player.pieces.push({ id: i, currentSlot: i, image: pieceCanvas, drawX: pX, drawY: pY });
    }

    player.shufflePuzzle();
    if (mode === 'multi') {
      player.state = 'WAITING';
    } else {
      player.startPlaying();
    }
  };

  const checkWin = (player: Player) => {
    let isWin = player.pieces.every(p => p.id === p.currentSlot);
    if (isWin && player.state !== 'SOLVED') {
      player.state = 'SOLVED';
      if (player.intervalId) clearInterval(player.intervalId);
      if (mode === 'multi') {
        let loser = playersRef.current.find(x => x.id !== player.id);
        if (loser) {
          loser.state = 'LOSE';
          if (loser.intervalId) clearInterval(loser.intervalId);
        }
      }
      setWinnerPlayer(player);
      setGameState('WIN');
    }
  };

  const updateAndDraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    if (!canvas || !ctx || !video) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.filter = "brightness(0.4)";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.restore();

    if (mode === 'multi') {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    }

    playersRef.current.forEach(p => {
      if (p.state === 'CALIBRATING') {
        ctx.fillStyle = p.color;
        ctx.font = "bold 24px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(`PLAYER ${p.id}: CREATE BOX`, p.bounds.x + p.bounds.w / 2, 80);
        ctx.font = "16px Inter";
        ctx.fillText(t('facePuzzle.instruction'), p.bounds.x + p.bounds.w / 2, 110);
      } else if (p.state === 'PLAYING') {
        p.slots.forEach(s => {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.strokeRect(s.x, s.y, s.w, s.h);
        });
        p.pieces.forEach((piece, idx) => {
          if (idx !== p.heldPieceIndex) {
            ctx.drawImage(piece.image, piece.drawX, piece.drawY);
            ctx.strokeStyle = "#222"; ctx.strokeRect(piece.drawX, piece.drawY, piece.image.width, piece.image.height);
          }
        });
        if (p.heldPieceIndex !== -1) {
          let held = p.pieces[p.heldPieceIndex];
          ctx.globalAlpha = 0.8; ctx.drawImage(held.image, held.drawX, held.drawY); ctx.globalAlpha = 1.0;
          ctx.strokeStyle = p.color; ctx.shadowBlur = 15; ctx.shadowColor = p.color;
          ctx.strokeRect(held.drawX, held.drawY, held.image.width, held.image.height); ctx.shadowBlur = 0;
        }
        ctx.fillStyle = p.color; ctx.font = "bold 30px Orbitron"; ctx.textAlign = "center";
        ctx.fillText(`${t('score')}: ${p.formatTime(p.elapsedTime)}`, p.bounds.x + p.bounds.w / 2, 60);
      } else if (p.state === 'WAITING' || p.state === 'LOSE') {
        p.pieces.forEach(piece => ctx.drawImage(piece.image, piece.drawX, piece.drawY));
        if (p.state === 'WAITING') {
          ctx.fillStyle = p.color; ctx.font = "bold 24px Orbitron"; ctx.textAlign = "center";
          ctx.fillText("Waiting...", p.bounds.x + p.bounds.w / 2, 60);
        }
      }
    });

    gameLoopRef.current = requestAnimationFrame(updateAndDraw);
  };

  const onResults = (results: any) => {
    if (camStatus !== 'ACTIVE') setCamStatus('ACTIVE');
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'PLAYING') return;

    let mappedHands: any[] = [];
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks: any) => {
        let mapped = landmarks.map((lm: any) => ({ x: (1 - lm.x) * canvas.width, y: lm.y * canvas.height }));
        mappedHands.push(mapped);
      });
    }

    playersRef.current.forEach(p => {
      let pHands = mappedHands.filter(h => {
        let avgX = h.reduce((s: number, l: any) => s + l.x, 0) / h.length;
        return avgX >= p.bounds.x && avgX <= p.bounds.x + p.bounds.w;
      });

      if (p.state === 'CALIBRATING' && pHands.length >= 2) {
        let h1 = pHands[0], h2 = pHands[1];
        let l = Math.min(h1[4].x, h1[8].x, h2[4].x, h2[8].x);
        let r = Math.max(h1[4].x, h1[8].x, h2[4].x, h2[8].x);
        let t = Math.min(h1[4].y, h1[8].y, h2[4].y, h2[8].y);
        let b = Math.max(h1[4].y, h1[8].y, h2[4].y, h2[8].y);
        p.box = { x: l, y: t, w: r - l, h: b - t };
        let pinch1 = p.getDistance(h1[4], h1[8]) < PINCH_THRESHOLD;
        let pinch2 = p.getDistance(h2[4], h2[8]) < PINCH_THRESHOLD;
        if (pinch1 && pinch2) capturePuzzle(p);
      } else if (p.state === 'PLAYING' && pHands.length > 0) {
        let h = pHands[0];
        let cursor = { x: (h[4].x + h[8].x) / 2, y: (h[4].y + h[8].y) / 2 };
        let pinching = p.getDistance(h[4], h[8]) < PINCH_THRESHOLD;

        if (pinching && !p.isPinching) {
          p.isPinching = true;
          for (let i = 0; i < p.pieces.length; i++) {
            let slot = p.slots[p.pieces[i].currentSlot];
            if (cursor.x >= slot.x && cursor.x <= slot.x + slot.w && cursor.y >= slot.y && cursor.y <= slot.y + slot.h) {
              p.heldPieceIndex = i; break;
            }
          }
        } else if (pinching && p.isPinching) {
          if (p.heldPieceIndex !== -1) {
            p.pieces[p.heldPieceIndex].drawX = cursor.x - p.slots[0].w / 2;
            p.pieces[p.heldPieceIndex].drawY = cursor.y - p.slots[0].h / 2;
          }
        } else if (!pinching && p.isPinching) {
          p.isPinching = false;
          if (p.heldPieceIndex !== -1) {
            let held = p.pieces[p.heldPieceIndex];
            let targetIdx = -1; let minDist = Infinity;
            p.slots.forEach((s, i) => {
              let d = p.getDistance(cursor, { x: s.x + s.w / 2, y: s.y + s.h / 2 });
              if (d < minDist) { minDist = d; targetIdx = i; }
            });
            if (targetIdx !== -1 && targetIdx !== held.currentSlot) {
              let other = p.pieces.find(pc => pc.currentSlot === targetIdx);
              if (other) { other.currentSlot = held.currentSlot; p.snapToSlot(other); }
              held.currentSlot = targetIdx;
            }
            p.snapToSlot(held); p.heldPieceIndex = -1; checkWin(p);
          }
        }
      }
    });

    if (mode === 'multi') {
      if (playersRef.current.every(p => p.state !== 'CALIBRATING' && p.state !== 'WAITING' && p.state !== 'PLAYING')) {
        // all done or something?
      } else if (playersRef.current.every(p => p.state !== 'CALIBRATING')) {
        playersRef.current.forEach(p => { if (p.state === 'WAITING') p.startPlaying(); });
      }
    }
  };

  const initCamera = async () => {
    if (camStatus === 'LOADING' || camStatus === 'ACTIVE') return;
    setCamStatus('LOADING');
    if (!handsRef.current) {
      const hands = new window.Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 4, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
      hands.onResults(onResults);
      handsRef.current = hands;
    }
    if (!cameraRef.current && videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await handsRef.current.send({ image: videoRef.current }); },
        width: 1280, height: 720
      });
      await camera.start();
      cameraRef.current = camera;
    }
  };

  const startGame = (m: 'single' | 'multi') => {
    setMode(m);
    playersRef.current = [];
    if (m === 'single') {
      playersRef.current.push(new Player(1, { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }, "#00FFFF"));
    } else {
      playersRef.current.push(new Player(1, { x: 0, y: 0, w: window.innerWidth / 2, h: window.innerHeight }, "#00FFFF"));
      playersRef.current.push(new Player(2, { x: window.innerWidth / 2, y: 0, w: window.innerWidth / 2, h: window.innerHeight }, "#FF00FF"));
    }
    setGameState('PLAYING');
    updateAndDraw();
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (cameraRef.current) cameraRef.current.stop();
      playersRef.current.forEach(p => { if (p.intervalId) clearInterval(p.intervalId); });
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-tech">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      
      <div className="absolute top-6 left-6 z-40 pointer-events-auto">
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all text-white"><ArrowLeft className="w-6 h-6" /></button>
      </div>

      <AnimatePresence>
        {gameState === 'MENU' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter uppercase"><span className="text-neon-cyan">YOUR FACE</span> <span className="text-neon-pink text-white italic">PUZZLE</span></h1>
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <button onClick={() => startGame('single')} className="group border-2 border-neon-cyan/40 hover:border-neon-cyan p-8 rounded-3xl bg-neon-cyan/5 w-72 transition-all">
                <h3 className="text-neon-cyan font-bold text-xl mb-2 uppercase">{t('singlePlayer')}</h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-300">{t('facePuzzle.desc')}</p>
              </button>
              <button onClick={() => startGame('multi')} className="group border-2 border-neon-pink/40 hover:border-neon-pink p-8 rounded-3xl bg-neon-pink/5 w-72 transition-all">
                <h3 className="text-neon-pink font-bold text-xl mb-2 uppercase">{t('multiPlayer')}</h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-300">{t('facePuzzle.desc')}</p>
              </button>
            </div>
            {camStatus !== 'ACTIVE' && (
              <button onClick={initCamera} className="bg-white text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all">{camStatus === 'LOADING' ? t('loadingCamera') : t('turnOnCamera')}</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState === 'WIN' && winnerPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center">
            <h1 className="text-6xl font-black mb-12 text-white uppercase italic">{mode === 'multi' ? `PLAYER ${winnerPlayer.id} ${t('wins')}!` : "PUZZLE SOLVED!"}</h1>
            <div className="bg-white/5 p-4 border border-white/10 rounded-3xl mb-12 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
               <p className="text-2xl font-bold text-neon-cyan mb-4">{t('score')}: {winnerPlayer.formatTime(winnerPlayer.elapsedTime)}</p>
            </div>
            <button onClick={() => { setGameState('MENU'); setWinnerPlayer(null); }} className="bg-white text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all">{t('backToMenu')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacePuzzle;
