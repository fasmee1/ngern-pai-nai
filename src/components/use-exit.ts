"use client";

import { useEffect, useRef, useState } from "react";

const EXIT_MS = 180;

// Lets a popup play its closing animation before it is removed.
// Returns whether it is closing, and a close function to use instead of onClose.
export function useExit(onClose: () => void): [boolean, () => void] {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  function close() {
    if (timer.current !== null) return;
    setClosing(true);
    timer.current = window.setTimeout(() => latest.current(), EXIT_MS);
  }
  return [closing, close];
}
