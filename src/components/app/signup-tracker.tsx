"use client";
import { useEffect } from "react";

interface SignupTrackerProps {
  createdAt: string;
}

export function SignupTracker({ createdAt }: SignupTrackerProps) {
  useEffect(() => {
    const key = "gtag_cadastro_sent";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    const createdMs = new Date(createdAt).getTime();
    const nowMs = Date.now();
    if (nowMs - createdMs > 10 * 60 * 1000) return;
    if ((window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18172780228/WiZOCP7cz7AcEMS9ut1D",
      });
    }
    localStorage.setItem(key, "1");
  }, [createdAt]);

  return null;
}
