"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function JobAutoRefresh({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "completed" || status === "failed" || status === "canceled") return;
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [jobId, status, router]);

  return null;
}
