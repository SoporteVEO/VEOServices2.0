import type { S3ImageType } from '@prisma/client';

export interface ActiveContractImage {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  type: S3ImageType;
  uploadedUser: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface ActiveContractWithImages {
  contractSourceId: number;
  contractDetailSourceId: number;
  description: string;
  startDate: Date;
  endDate: Date;
  contractNumber: string;
  billboardCode: string;
  billboardAddress: string;
  customerName: string;
  customerEmail: string;
  images: ActiveContractImage[];
}
