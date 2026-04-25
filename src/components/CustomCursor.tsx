import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Use a very high stiffness spring or direct motion values for "zero lag" feel
  const springConfig = { damping: 40, stiffness: 800, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') !== null
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      {/* Precision Core */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full z-50 mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      
      {/* Reactive Halo */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-neon-cyan/40 rounded-full"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isPointer ? 1.8 : 1,
          borderColor: isPointer ? '#ff00de' : '#00fff2',
          borderWidth: isPointer ? '2px' : '1px',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />

      {/* Trailing Tech Accents */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-neon-cyan/20 rounded-tl-lg"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-60%',
          translateY: '-60%',
          rotate: isPointer ? 45 : 0
        }}
        animate={{
            opacity: isPointer ? 0.8 : 0,
            scale: isPointer ? 1 : 0.5,
        }}
      />
    </div>
  );
}
