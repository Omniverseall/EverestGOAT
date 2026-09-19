import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(10);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Smooth progress simulation over ~1.5 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const remaining = 100 - prev;
        const step = Math.max(2, Math.floor(remaining * 0.28));
        return Math.min(100, prev + step);
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Hold for a moment at 100%
      const exitTimer = setTimeout(() => {
        setExiting(true);
      }, 350);

      // Complete transition
      const hideTimer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 1050);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [progress, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#F5F7FA] flex flex-col items-center justify-between p-8 sm:p-12 select-none transition-all duration-700 ease-in-out ${
        exiting ? 'opacity-0 scale-105 blur-xs pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft ambient background aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(1,84,248,0.1)_0%,_rgba(245,247,250,0.4)_50%,_#F5F7FA_100%)] pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full h-8" />

      {/* Huge Center Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto">
        <div className="relative flex items-center justify-center">
          {/* Blue ambient glow behind logo */}
          <div className="absolute w-[80vw] max-w-[800px] h-[50vh] max-h-[500px] bg-[#0154F8]/12 rounded-full blur-3xl pointer-events-none" />
          
          {/* Giant Logo */}
          <img
            src="/logo.png"
            alt="Everest LC"
            className="relative w-[88vw] max-w-[850px] max-h-[58vh] h-auto object-contain drop-shadow-xl select-none animate-hero-logo"
          />
        </div>
      </div>

      {/* Bottom Loading Indicator */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md pb-4">
        {/* Sleek Progress Bar */}
        <div className="w-64 sm:w-80 h-2 bg-[#EBEDF0] rounded-full overflow-hidden p-0.5 border border-[#E5E7EB] shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#0154F8] via-[#3B82F6] to-[#0154F8] rounded-full transition-all duration-100 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wide uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0154F8] animate-ping" />
          <span>{progress < 100 ? 'Yuklanmoqda...' : 'Everest LC'}</span>
        </div>
      </div>
    </div>
  );
}
