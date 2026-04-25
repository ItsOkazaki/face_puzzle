/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Instagram, Gamepad2, Zap, UserSquare2, Globe, Github, Info, MousePointer2 } from 'lucide-react';
import './lib/i18n';

import CyberConnect from './games/CyberConnect';
import NeonHockey from './games/NeonHockey';
import FacePuzzle from './games/FacePuzzle';
import InteractiveBackground from './components/InteractiveBackground';
import CustomCursor from './components/CustomCursor';
import { cn } from './lib/utils';

type GameID = 'cyber' | 'hockey' | 'puzzle' | null;

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeGame, setActiveGame] = useState<GameID>(null);
  const [isRTL, setIsRTL] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  useEffect(() => {
    setIsRTL(i18n.language === 'ar');
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const games = [
    {
      id: 'cyber' as const,
      name: t('cyberConnect.name'),
      desc: t('cyberConnect.desc'),
      icon: <Gamepad2 className="w-10 h-10 text-neon-cyan" />,
      color: 'border-neon-cyan/20 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_30px_rgba(0,255,242,0.2)]',
      bg: 'bg-black/40',
      accent: 'text-neon-cyan',
      glow: 'group-hover:bg-neon-cyan/50'
    },
    {
      id: 'hockey' as const,
      name: t('neonHockey.name'),
      desc: t('neonHockey.desc'),
      icon: <Gamepad2 className="w-10 h-10 text-neon-pink" />,
      color: 'border-neon-pink/20 hover:border-neon-pink hover:bg-neon-pink/10 hover:shadow-[0_0_30px_rgba(255,0,222,0.2)]',
      bg: 'bg-black/40',
      accent: 'text-neon-pink',
      glow: 'group-hover:bg-neon-pink/50'
    },
    {
      id: 'puzzle' as const,
      name: t('facePuzzle.name'),
      desc: t('facePuzzle.desc'),
      icon: <UserSquare2 className="w-10 h-10 text-neon-yellow" />,
      color: 'border-neon-yellow/20 hover:border-neon-yellow hover:bg-neon-yellow/10 hover:shadow-[0_0_30px_rgba(255,255,0,0.2)]',
      bg: 'bg-black/40',
      accent: 'text-neon-yellow',
      glow: 'group-hover:bg-neon-yellow/50'
    }
  ];

  return (
    <div ref={containerRef} className={cn("min-h-screen font-sans selection:bg-neon-cyan/30 text-white cursor-none", isRTL && "font-sans-ar")}>
      <CustomCursor />
      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
            className="relative min-h-[150vh]"
          >
            <InteractiveBackground />

            {/* Navbar */}
            <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none">
              <div className="flex items-center gap-3 bg-black/50 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 pointer-events-auto shadow-2xl">
                 <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                 <span className="font-tech font-bold text-sm tracking-tighter uppercase italic">{t('title')}</span>
              </div>
              
              <button
                onClick={toggleLanguage}
                className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl hover:bg-white/5 transition-all text-xs font-bold tracking-widest uppercase"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'en' ? 'Arabic / العربية' : 'English'}
              </button>
            </header>

            <motion.section 
              style={{ opacity: headerOpacity, scale: headerScale }}
              className="h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
            >
              {/* Decorative background elements for Hero */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />
              
              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none z-20">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-[0.15] animate-[flicker_0.15s_infinite]" />
              </div>

              <style>{`
                @keyframes flicker {
                  0% { opacity: 0.150; }
                  100% { opacity: 0.155; }
                }
              `}</style>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
                  }
                }}
                className="relative z-10"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                   <div className="h-px w-12 bg-neon-cyan/50" />
                   <span className="text-neon-cyan font-tech text-[10px] tracking-[0.6em] uppercase animate-pulse">Tactile Innovation</span>
                   <div className="h-px w-12 bg-neon-cyan/50" />
                </div>

                <h1 className="text-5xl md:text-[7rem] font-black font-tech tracking-[-0.05em] uppercase mb-8 leading-[0.9] flex flex-col items-center group cursor-default">
                  <motion.span 
                    variants={{ hidden: { y: 100, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 15 } } }}
                    className="text-white block mb-2 relative"
                  >
                    FUTURE OF
                    <span className="absolute inset-0 text-neon-pink opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-75 mix-blend-screen">FUTURE OF</span>
                    <span className="absolute inset-0 text-neon-cyan opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:translate-y-1 transition-all duration-75 mix-blend-screen">FUTURE OF</span>
                  </motion.span>
                  <motion.span 
                    variants={{ hidden: { y: 100, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 15 } } }}
                    className="text-gradient-cyan block italic drop-shadow-[0_0_50px_rgba(0,255,242,0.3)]"
                  >
                    INTERACTION
                  </motion.span>
                </h1>
                
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="max-w-4xl mx-auto w-full"
                >
                  <p className="text-gray-400 font-medium text-sm md:text-lg uppercase leading-relaxed tracking-[0.2em] opacity-60 mb-12">
                    {t('subtitle')}
                  </p>

                  <div className="flex justify-center">
                     <button 
                       onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                       className="group relative px-16 py-5 bg-transparent border border-neon-cyan/50 overflow-hidden transition-all duration-500 hover:border-white rounded-full"
                     >
                       <div className="absolute inset-0 bg-neon-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(0,255,242,0.2)_0%,transparent_70%)] transition-opacity duration-700" />
                       
                       <span className="relative z-10 flex items-center gap-4 text-neon-cyan font-tech text-base tracking-[0.4em] uppercase group-hover:text-white transition-colors">
                         <Gamepad2 className="w-6 h-6 animate-pulse" />
                         Enter Interface
                       </span>
                       
                       {/* Corner accents */}
                       <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan" />
                       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-cyan" />
                       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-cyan" />
                       <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan" />
                     </button>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-24 flex flex-col items-center gap-6 group cursor-pointer"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                <div className="relative group">
                   <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                   <div className="relative w-12 h-20 rounded-full border border-white/20 flex items-start justify-center p-2">
                      <motion.div 
                        animate={{ y: [0, 12, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-1.5 h-3 bg-neon-cyan rounded-full"
                      />
                   </div>
                </div>
                <span className="text-[9px] font-black tracking-[0.5em] uppercase text-white/30 group-hover:text-neon-cyan transition-colors">Initiate Sequence</span>
              </motion.div>
            </motion.section>

            {/* Game Grid Section */}
            <section className="min-h-screen py-32 px-6 flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-24 text-center"
              >
                <h2 className="font-tech text-4xl font-black uppercase tracking-widest mb-6 italic">
                    <span className="text-white opacity-40">SELECT</span> <span className="text-gradient-cyan">ENVIRONMENT</span>
                </h2>
                <div className="w-48 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent mx-auto rounded-full" />
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl w-full">
                {games.map((game, i) => (
                  <motion.div
                    key={game.id}
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    whileInView={{ y: 0, opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.8, type: 'spring', bounce: 0.3 }}
                  >
                    <button
                      onClick={() => setActiveGame(game.id)}
                      className={cn(
                        "group relative flex flex-col w-full h-[500px] text-left p-12 rounded-[3.5rem] border-2 transition-all duration-700 overflow-hidden",
                        game.color,
                        game.bg
                      )}
                    >
                      {/* Scanning Line Effect */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 -translate-y-full group-hover:animate-[scan_3s_linear_infinite]" />
                      
                      <style>{`
                        @keyframes scan {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(500px); }
                        }
                      `}</style>

                      {/* Glow effect */}
                      <div className={cn("absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] transition-all duration-700 opacity-0 group-hover:opacity-30", game.glow)} />
                      
                      <div className="mb-12 p-6 w-fit rounded-[2rem] bg-black/60 border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all duration-500 shadow-2xl backdrop-blur-xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        {game.icon}
                      </div>

                      <div className="space-y-4">
                        <h3 className={cn("font-tech font-black text-4xl tracking-tighter uppercase italic leading-none", game.accent)}>
                            {game.id === 'cyber' ? 'CYBER' : game.id === 'hockey' ? 'NEON' : 'FACE'}<br/>
                            <span className="text-white">{game.id === 'cyber' ? 'CONNECT' : game.id === 'hockey' ? 'HOCKEY' : 'PUZZLE'}</span>
                        </h3>

                        <p className="text-gray-400 text-lg leading-snug group-hover:text-gray-200 transition-colors duration-500 max-w-[280px]">
                            {game.desc}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pointer-events-none">
                        <motion.div 
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-4 text-xs font-black tracking-[0.4em] uppercase opacity-20 group-hover:opacity-100 transition-all text-neon-cyan"
                        >
                           <span>Launch Mode</span>
                           <MousePointer2 className="w-5 h-5" />
                        </motion.div>
                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-neon-cyan group-hover:text-black group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-[0_0_20px_#00fff2]">
                           <Gamepad2 className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Features Info */}
            <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
               <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-20 items-center">
                  <div className="flex-1 space-y-8">
                     <h2 className="font-tech text-4xl font-black uppercase italic tracking-tighter leading-none">
                        No Controller<br />
                        <span className="text-neon-cyan italic">Just Vision</span>
                     </h2>
                     <p className="text-gray-400 text-lg">
                        Our games utilize a sophisticated hand tracking engine that runs directly in your browser. 
                        No specialized hardware needed—just your webcam and your skill.
                     </p>
                     <div className="flex gap-8">
                        <div className="space-y-2">
                           <p className="font-tech text-neon-cyan text-2xl font-bold">21</p>
                           <p className="text-xs uppercase tracking-widest text-gray-500">Tracking Points</p>
                        </div>
                        <div className="space-y-2">
                           <p className="font-tech text-neon-pink text-2xl font-bold">~30</p>
                           <p className="text-xs uppercase tracking-widest text-gray-500">FPS Engine</p>
                        </div>
                        <div className="space-y-2">
                           <p className="font-tech text-neon-yellow text-2xl font-bold">0.05s</p>
                           <p className="text-xs uppercase tracking-widest text-gray-500">Latency</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 w-full aspect-square md:aspect-video relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl group">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <UserSquare2 className="w-32 h-32 text-white/5 animate-pulse group-hover:text-neon-cyan/20 transition-colors" />
                     </div>
                     <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
                        <p className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Info className="w-4 h-4 text-neon-cyan" />
                           Pro Tip
                        </p>
                        <p className="text-xs text-gray-400">Keep your hand within the camera frame and avoid busy backgrounds for the best tracking performance.</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* Developer Credits - Fixed as requested */}
            <footer className="py-32 flex flex-col items-center">
              <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent mb-16" />
              
              <div className="flex flex-col items-center text-xs text-gray-500 font-tech tracking-widest gap-2">
                <p className="mb-4 opacity-50 uppercase text-[10px] tracking-[0.5em]">{t('devLabel')}</p>

                <motion.p 
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  className="text-white text-3xl font-black tracking-tighter mb-4 uppercase italic"
                >
                  Rahmani Mostapha
                </motion.p>

                <p className="text-gray-400 font-medium mb-12 uppercase text-xs tracking-[0.3em]">
                  {t('clubLabel')}: <span className="text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,242,0.4)]">Quantum Code</span>
                </p>

                <div className="flex gap-4">
                  <a 
                    href="https://instagram.com/itsmeokazaki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-8 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-neon-cyan hover:border-neon-cyan/40 hover:bg-neon-cyan/10 transition-all duration-500 hover:scale-110"
                  >
                    <Instagram className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-bold tracking-tight text-sm">@itsmeokazaki</span>
                  </a>

                  <a 
                    href="https://instagram.com/qc__club"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-8 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-neon-pink hover:border-neon-pink/40 hover:bg-neon-pink/10 transition-all duration-500 hover:scale-110"
                  >
                    <Instagram className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />
                    <span className="font-bold tracking-tight text-sm">@qc__club</span>
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-screen relative"
          >
            {/* HUD / Tech Frame */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-white/[0.02] -z-10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-pink/20 to-transparent" />
            
            {/* Fixed Tech Back Button */}
            <motion.button
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, type: 'spring' }}
                onClick={() => setActiveGame(null)}
                className="fixed top-8 left-8 z-[100] group flex items-center gap-4 bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-2xl hover:border-neon-cyan transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-neon-cyan/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <motion.div 
                    animate={{ x: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Zap className="w-5 h-5 text-neon-cyan rotate-90" />
                </motion.div>
                <div className="flex flex-col items-start leading-none relative z-10">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500 group-hover:text-neon-cyan transition-colors">Abort</span>
                    <span className="text-sm font-tech font-bold uppercase tracking-widest text-white">System.Exit()</span>
                </div>
            </motion.button>

            {/* Game Content */}
            {activeGame === 'cyber' && <CyberConnect onBack={() => setActiveGame(null)} />}
            {activeGame === 'hockey' && <NeonHockey onBack={() => setActiveGame(null)} />}
            {activeGame === 'puzzle' && <FacePuzzle onBack={() => setActiveGame(null)} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

