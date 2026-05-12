export type HeartbeatRejectReason = "OUT_OF_HOURS" | "RATE_LIMITED" | "AFK_GAP";

export type UserMetricsSummary = {
  todayMs: number;
  weekMs: number;
  monthMs: number;
  days: { date: string; activeMs: number }[];
};

export type HeartbeatResult = {
  counted: boolean;
  creditedMs: number;
  reason?: HeartbeatRejectReason;
  summary: UserMetricsSummary;
};
