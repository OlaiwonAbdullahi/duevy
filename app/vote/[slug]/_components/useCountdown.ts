"use client";

import { useEffect, useState } from "react";

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function diff(deadlineIso: string): Countdown {
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const seconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    expired: false,
  };
}

/** A live-ticking countdown to a poll's voting deadline. */
export function useCountdown(deadlineIso: string): Countdown {
  const [value, setValue] = useState(() => diff(deadlineIso));

  useEffect(() => {
    setValue(diff(deadlineIso));
    const id = setInterval(() => setValue(diff(deadlineIso)), 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  return value;
}
