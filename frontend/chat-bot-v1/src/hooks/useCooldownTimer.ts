import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCooldownTimerProps {
  onTimerComplete?: (isInstanceBlock: boolean) => void;
}

export const useCooldownTimer = ({ onTimerComplete }: UseCooldownTimerProps = {}) => {
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((seconds: number, isInstanceBlock: boolean) => {
    setCooldownTimer(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          
          if (isInstanceBlock) {
            setIsBlocked(false);
          }
          
          onTimerComplete?.(isInstanceBlock);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onTimerComplete]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCooldownTimer(0);
    setIsBlocked(false);
  }, []);

  const setBlocked = useCallback((blocked: boolean) => {
    setIsBlocked(blocked);
  }, []);

  const formatTime = useCallback((seconds: number) => 
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    cooldownTimer,
    isBlocked,
    startTimer,
    clearTimer,
    setBlocked,
    formatTime
  };
};
