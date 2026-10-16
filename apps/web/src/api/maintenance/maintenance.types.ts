export type MaintenanceJobKind = "STATIC" | "DIGITAL";

export type MaintenanceJobStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

export type MaintenanceEventType =
  | "CREATED"
  | "UPDATED"
  | "REASSIGNED"
  | "RESCHEDULED"
  | "STARTED"
  | "PHOTO_UPLOADED"
  | "PHOTO_DELETED"
  | "COMMENTED"
  | "COMPLETED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export interface MaintenancePerson {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface MaintenanceCategory {
  id: string;
  kind: MaintenanceJobKind;
  name: string;
  color: string | null;
  archived: boolean;
  jobCount: number;
  createdAt: string;
}

export interface MaintenancePhoto {
  id: string;
  url: string;
  note: string | null;
  uploadedBy: MaintenancePerson | null;
  createdAt: string;
  /** Set once the photo was copied into the Imágenes module. */
  publishedImageId: string | null;
}

export interface MaintenanceComment {
  id: string;
  body: string;
  author: MaintenancePerson | null;
  createdAt: string;
}

export interface MaintenanceEvent {
  id: string;
  type: MaintenanceEventType;
  message: string | null;
  actor: MaintenancePerson | null;
  createdAt: string;
}

export interface MaintenanceJobListItem {
  id: string;
  code: string;
  kind: MaintenanceJobKind;
  status: MaintenanceJobStatus;
  billboardId: number | null;
  digitalBillboardId: string | null;
  billboardCode: string | null;
  billboardName: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  category: { id: string; name: string; color: string | null } | null;
  assignedUser: MaintenancePerson;
  photoCount: number;
  commentCount: number;
  createdAt: string;
  isOverdue: boolean;
}

export interface MaintenanceJob extends MaintenanceJobListItem {
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  reference: string | null;
  cancelledAt: string | null;
  completionNotes: string | null;
  createdBy: MaintenancePerson | null;
  photos: MaintenancePhoto[];
  comments: MaintenanceComment[];
  events: MaintenanceEvent[];
  minutesToStart: number | null;
  minutesWorked: number | null;
}

export interface MaintenanceOverview {
  totals: {
    all: number;
    overdue: number;
    photos: number;
    completionRate: number;
    avgMinutesToStart: number | null;
    avgMinutesWorked: number | null;
  };
  byStatus: { status: MaintenanceJobStatus; count: number }[];
  byCategory: {
    categoryId: string | null;
    name: string;
    color: string | null;
    total: number;
    completed: number;
    avgMinutesWorked: number | null;
  }[];
  byTechnician: {
    userId: string;
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    avgMinutesWorked: number | null;
    photosUploaded: number;
  }[];
  completionTrend: { date: string; completed: number }[];
}

export interface CreateMaintenanceJobInput {
  kind: MaintenanceJobKind;
  billboardId?: number;
  digitalBillboardId?: string;
  billboardCode?: string | null;
  address?: string | null;
  cityName?: string | null;
  departmentName?: string | null;
  width?: number | null;
  height?: number | null;
  assignedUserId: string;
  description: string;
  scheduledAt: string;
  categoryId?: string | null;
}

export interface UpdateMaintenanceJobInput {
  assignedUserId?: string;
  description?: string;
  scheduledAt?: string;
  categoryId?: string | null;
  status?: MaintenanceJobStatus;
  completionNotes?: string;
}

export interface MaintenanceJobsQuery {
  kind: MaintenanceJobKind;
  search?: string;
  status?: MaintenanceJobStatus;
  categoryId?: string;
  assignedUserId?: string;
  page?: number;
  pageSize?: number;
}
