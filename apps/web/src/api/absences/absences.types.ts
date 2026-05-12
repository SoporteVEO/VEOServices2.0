export type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AbsenceImage = {
  id: string;
  url: string;
  createdAt: string;
};

export type AbsenceUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type Absence = {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: AbsenceStatus;
  createdAt: string;
  updatedAt: string;
  images: AbsenceImage[];
  user: AbsenceUser;
};

export type CreateAbsenceInput = {
  fromDate: string;
  toDate: string;
  reason: string;
  /** Base64 encoded images (without data URI prefix). */
  images?: string[];
};

export type UpdateAbsenceInput = {
  fromDate?: string;
  toDate?: string;
  reason?: string;
  /** IDs of existing images to remove. */
  removedImageIds?: string[];
  /** Base64 encoded images (without data URI prefix) to add. */
  addedImages?: string[];
};
