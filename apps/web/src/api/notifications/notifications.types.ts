export type UserNotificationStatus = "PENDING" | "VIEWED" | "DELETED";

export type NotificationPriority = "HIGH" | "MEDIUM" | "LOW";

export type Notification = {
  id: string;
  userId: string;
  status: UserNotificationStatus;
  description: string;
  priority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
};

export type ActiveNotificationsResponse = {
  data: Notification[];
  pendingCount: number;
};
