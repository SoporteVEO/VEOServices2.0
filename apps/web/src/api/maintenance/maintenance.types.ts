export type MaintenanceJobStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MaintenanceEventType =
  | "CREATED"
  | "UPDATED"
  | "REASSIGNED"
  | "RESCHEDULED"
  | "STARTED"
  | "PHOTO_UPLOADED"
  | "PHOTO_DELETED"
  | "COMPLETED"
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
  status: MaintenanceJobStatus;
  billboardId: number | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  category: { id: string; name: string; color: string | null } | null;
  assignedUser: MaintenancePerson;
  photoCount: number;
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
  billboardId: number;
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
  search?: string;
  status?: MaintenanceJobStatus;
  categoryId?: string;
  assignedUserId?: string;
  page?: number;
  pageSize?: number;
}
