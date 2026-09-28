import { useEffect } from 'react';
import { useContestStore } from '../store/useContestStore';

export function useTimer() {
  const isTimerRunning = useContestStore((state) => state.isTimerRunning);
  const timeRemainingSeconds = useContestStore((state) => state.timeRemainingSeconds);
  const tickTimer = useContestStore((state) => state.tickTimer);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  const hours = Math.floor(timeRemainingSeconds / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  const seconds = timeRemainingSeconds % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    timeRemainingSeconds,
    isTimerRunning,
    formattedTime,
    hours,
    minutes,
    seconds,
  };
}
