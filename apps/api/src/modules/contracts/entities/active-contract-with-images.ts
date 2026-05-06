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
  billboardLatitude: number | null;
  billboardLongitude: number | null;
  customerName: string;
  customerEmail: string;
  images: ActiveContractImage[];
}

export interface ActiveContractGroup {
  contractNumber: string;
  contractSourceId: number;
  description: string;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate: Date;
  billboards: ActiveContractWithImages[];
  totalBillboards: number;
  totalImages: number;
  billboardsWithImages: number;
}

export interface PaginatedActiveContracts {
  data: ActiveContractGroup[];
  total: number;
  page: number;
  pageSize: number;
}
