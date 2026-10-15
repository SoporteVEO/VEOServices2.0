export type PatchNoteAuthor = {
  id: string;
  firstName: string;
  lastName: string | null;
};

export type PatchNote = {
  id: string;
  version: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  createdBy: PatchNoteAuthor | null;
};

export type PatchNoteInput = {
  version: string;
  title: string;
  body: string;
};

export type CurrentVersion = {
  version: string | null;
};
