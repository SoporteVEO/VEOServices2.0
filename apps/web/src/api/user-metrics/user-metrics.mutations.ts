import { api } from "@/lib/api";
import type { HeartbeatResult } from "./user-metrics.types";

export async function sendActivityHeartbeat(): Promise<HeartbeatResult> {
  const { data } = await api.post<{ data: HeartbeatResult }>(
    "/me/metrics/heartbeat",
  );
  return data.data;
}
