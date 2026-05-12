"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { USER_METRICS_QUERY_KEY } from "@/api/user-metrics/user-metrics.get";
import { sendActivityHeartbeat } from "@/api/user-metrics/user-metrics.mutations";
import type {
  HeartbeatResult,
  UserMetricsSummary,
} from "@/api/user-metrics/user-metrics.types";
import { AfkDialog } from "@/components/dashboard/afk-dialog";

const HEARTBEAT_INTERVAL_MS = 15_000;
const IDLE_THRESHOLD_MS = 60_000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "pointerdown",
] as const;

export function ActivityTracker() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const enabled = Boolean(session?.user);

  const lastActivityAtRef = useRef<number>(Date.now());
  const inFlightRef = useRef<boolean>(false);
  const [isAfk, setIsAfk] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let idleTimerId: number | undefined;

    const scheduleAfkCheck = () => {
      if (idleTimerId !== undefined) window.clearTimeout(idleTimerId);
      idleTimerId = window.setTimeout(() => {
        if (
          document.visibilityState === "visible" &&
          document.hasFocus()
        ) {
          setIsAfk(true);
        }
      }, IDLE_THRESHOLD_MS);
    };

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
      setIsAfk(false);
      scheduleAfkCheck();
    };

    const pauseAfkCheck = () => {
      setIsAfk(false);
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
        idleTimerId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      } else {
        pauseAfkCheck();
      }
    };

    const isUserActive = () => {
      if (document.visibilityState !== "visible") return false;
      if (!document.hasFocus()) return false;
      const idleFor = Date.now() - lastActivityAtRef.current;
      return idleFor <= IDLE_THRESHOLD_MS;
    };

    const sendHeartbeat = async () => {
      if (inFlightRef.current) return;
      if (!isUserActive()) return;

      inFlightRef.current = true;
      try {
        const result: HeartbeatResult = await sendActivityHeartbeat();
        queryClient.setQueryData<UserMetricsSummary>(
          USER_METRICS_QUERY_KEY,
          result.summary,
        );
      } catch {
      } finally {
        inFlightRef.current = false;
      }
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", markActivity);
    window.addEventListener("blur", pauseAfkCheck);

    scheduleAfkCheck();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (idleTimerId !== undefined) window.clearTimeout(idleTimerId);
      window.clearInterval(intervalId);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", markActivity);
      window.removeEventListener("blur", pauseAfkCheck);
    };
  }, [enabled, queryClient]);

  return (
    <AfkDialog
      open={enabled && isAfk}
      onDismiss={() => setIsAfk(false)}
    />
  );
}
