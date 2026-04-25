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

interface NeonHockeyProps {
  onBack: () => void;
}

const NeonHockey: React.FC<NeonHockeyProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'COUNTDOWN' | 'PLAYING' | 'SCORED' | 'OVER'>('MENU');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [countdown, setCountdown] = useState(3);
  const [camStatus, setCamStatus] = useState<'IDLE' | 'LOADING' | 'ACTIVE'>('IDLE');
  const [winner, setWinner] = useState<string | null>(null);

  const gameLoopRef = useRef<number | null>(null);
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, speed: 0, color: '#ffff00' });
  const paddlesRef = useRef({
    p1: { x: 0, y: 0, targetX: 0, targetY: 0, active: false, color: '#00fff2' },
    p2: { x: 0, y: 0, targetX: 0, targetY: 0, active: false, color: '#ff0055' }
  });
  const particlesRef = useRef<any[]>([]);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const WIN_SCORE = 7;
  const PADDLE_RADIUS = 40;
  const BALL_RADIUS = 20;
  const INITIAL_SPEED = 12;

  const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

  const resetBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ballRef.current.x = canvas.width / 2;
    ballRef.current.y = canvas.height / 2;
    ballRef.current.speed = INITIAL_SPEED;
    ballRef.current.color = '#ffff00';
    let angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
    let dir = Math.random() > 0.5 ? 1 : -1;
    ballRef.current.vx = Math.cos(angle) * ballRef.current.speed * dir;
    ballRef.current.vy = Math.sin(angle) * ballRef.current.speed;
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: color
      });
    }
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ['p1', 'p2'].forEach(p => {
      const paddle = (paddlesRef.current as any)[p];
      if (paddle.active) {
        if (paddle.x === 0 && paddle.y === 0) {
          paddle.x = paddle.targetX;
          paddle.y = paddle.targetY;
        } else {
          paddle.x = lerp(paddle.x, paddle.targetX, 0.5);
          paddle.y = lerp(paddle.y, paddle.targetY, 0.5);
        }
      }
    });

    if (gameState === 'PLAYING') {
      ballRef.current.x += ballRef.current.vx;
      ballRef.current.y += ballRef.current.vy;

      if (ballRef.current.y - BALL_RADIUS < 0) {
        ballRef.current.y = BALL_RADIUS;
        ballRef.current.vy *= -1;
      } else if (ballRef.current.y + BALL_RADIUS > canvas.height) {
        ballRef.current.y = canvas.height - BALL_RADIUS;
        ballRef.current.vy *= -1;
      }

      if (ballRef.current.x < 0) {
        handleScore('p1');
      } else if (ballRef.current.x > canvas.width) {
        handleScore('p2');
      }

      ['p1', 'p2'].forEach(key => {
        let p = (paddlesRef.current as any)[key];
        if (!p.active) return;
        let dx = ballRef.current.x - p.x;
        let dy = ballRef.current.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_RADIUS + PADDLE_RADIUS) {
          let nx = dx / dist;
          let ny = dy / dist;
          ballRef.current.speed = Math.min(ballRef.current.speed * 1.05, 35);
          ballRef.current.vx = nx * ballRef.current.speed;
          ballRef.current.vy = ny * ballRef.current.speed;
          ballRef.current.color = p.color;
          let overlap = (BALL_RADIUS + PADDLE_RADIUS) - dist;
          ballRef.current.x += nx * overlap;
          ballRef.current.y += ny * overlap;
          spawnParticles((ballRef.current.x + p.x) / 2, (ballRef.current.y + p.y) / 2, p.color);
        }
      });
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      let p = particlesRef.current[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const handleScore = (winnerKey: 'p1' | 'p2') => {
    setScores(prev => {
      const next = { ...prev, [winnerKey]: prev[winnerKey] + 1 };
      if (next[winnerKey] >= WIN_SCORE) {
        setWinner(winnerKey === 'p1' ? "PLAYER 1" : "PLAYER 2");
        setGameState('OVER');
      } else {
        setGameState('SCORED');
        setTimeout(() => {
          resetBall();
          setGameState('PLAYING');
        }, 1000);
      }
      return next;
    });
    spawnParticles(ballRef.current.x, ballRef.current.y, '#fff');
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    if (!canvas || !ctx || !video) return;

    update();

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (gameState !== 'MENU') {
      ctx.shadowBlur = 30;
      ctx.strokeStyle = paddlesRef.current.p1.color;
      ctx.shadowColor = paddlesRef.current.p1.color;
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, canvas.height); ctx.stroke();
      ctx.strokeStyle = paddlesRef.current.p2.color;
      ctx.shadowColor = paddlesRef.current.p2.color;
      ctx.beginPath(); ctx.moveTo(canvas.width, 0); ctx.lineTo(canvas.width, canvas.height); ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
      ctx.setLineDash([]);

      if (gameState !== 'OVER') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = ballRef.current.color;
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ballRef.current.color;
        ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
      }

      ['p1', 'p2'].forEach(key => {
        let p = (paddlesRef.current as any)[key];
        if (!p.active) return;
        ctx.shadowBlur = 30; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, PADDLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = p.color; ctx.stroke();
      });

      particlesRef.current.forEach(p => {
        ctx.shadowBlur = 5; ctx.shadowColor = p.color;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
      });
    }

    gameLoopRef.current = requestAnimationFrame(draw);
  };

  const startCountdown = () => {
    setGameState('COUNTDOWN');
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown(0);
      } else {
        clearInterval(timer);
        setGameState('PLAYING');
        resetBall();
      }
    }, 1000);
  };

  const initCamera = async () => {
    if (camStatus === 'LOADING' || camStatus === 'ACTIVE') return;
    setCamStatus('LOADING');
    if (!handsRef.current) {
      const hands = new window.Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      hands.onResults((results: any) => {
        let foundP1 = false, foundP2 = false;
        if (results.multiHandLandmarks) {
          results.multiHandLandmarks.forEach((landmarks: any) => {
            const x = landmarks[8].x * (canvasRef.current?.width || 0);
            const y = landmarks[8].y * (canvasRef.current?.height || 0);
            if (landmarks[8].x < 0.5) {
              paddlesRef.current.p1.targetX = x; paddlesRef.current.p1.targetY = y; paddlesRef.current.p1.active = true; foundP1 = true;
            } else {
              paddlesRef.current.p2.targetX = x; paddlesRef.current.p2.targetY = y; paddlesRef.current.p2.active = true; foundP2 = true;
            }
          });
        }
        if (!foundP1) paddlesRef.current.p1.active = false;
        if (!foundP2) paddlesRef.current.p2.active = false;
      });
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
    setCamStatus('ACTIVE');
    draw();
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-tech">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex justify-between items-center p-8">
          <div className="text-neon-pink text-6xl font-black drop-shadow-[0_0_15px_rgba(255,0,85,0.6)]">{scores.p2}</div>
          <div className="text-neon-cyan text-6xl font-black drop-shadow-[0_0_15px_rgba(0,255,242,0.6)]">{scores.p1}</div>
        </div>
      </div>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all pointer-events-auto"><ArrowLeft className="w-6 h-6" /></button>
      </div>
      <AnimatePresence>
        {gameState === 'MENU' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-gradient-cyan uppercase">{t('neonHockey.name')}</h1>
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="border border-neon-pink p-6 rounded-2xl bg-neon-pink/5 w-64"><h3 className="text-neon-pink font-bold mb-2 uppercase">{t('neonHockey.player2')}</h3><p className="text-xs text-gray-400">{t('neonHockey.desc')}</p></div>
              <div className="border border-neon-cyan p-6 rounded-2xl bg-neon-cyan/5 w-64"><h3 className="text-neon-cyan font-bold mb-2 uppercase">{t('neonHockey.player1')}</h3><p className="text-xs text-gray-400">{t('neonHockey.desc')}</p></div>
            </div>
            <div className="flex flex-col gap-4 items-center">
              {camStatus !== 'ACTIVE' ? (
                <button onClick={initCamera} className="bg-white text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all">{camStatus === 'LOADING' ? t('loadingCamera') : t('turnOnCamera')}</button>
              ) : (
                <button onClick={startCountdown} className="bg-neon-yellow text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,0,0.4)]">{t('startGame')}</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gameState === 'COUNTDOWN' && (
          <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <span className="text-white text-[10rem] font-black drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]">{countdown === 0 ? "GO!" : countdown}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gameState === 'OVER' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg p-6 text-center">
            <h1 className="text-6xl font-black mb-4 text-white uppercase italic">{winner} {t('wins')}!</h1>
            <h2 className="text-4xl font-bold mb-12 text-gray-400">{scores.p2} - {scores.p1}</h2>
            <button onClick={() => { setScores({ p1: 0, p2: 0 }); startCountdown(); }} className="bg-white text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all">{t('rematch')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeonHockey;
