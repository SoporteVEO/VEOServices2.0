export type UserAppUsageDailyRow = {
  date: string;
  totalMs: number;
  activeUserCount: number;
};

export type UserAppUsageUserRow = {
  userId: string;
  publicId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  disabled: boolean;
  totalMs: number;
  activeDays: number;
};

export type UserAppUsageReport = {
  range: { from: string; to: string };
  daily: UserAppUsageDailyRow[];
  users: UserAppUsageUserRow[];
};
