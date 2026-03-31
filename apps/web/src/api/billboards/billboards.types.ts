export interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

export interface AvailableBillboard {
  billboardId: number;
  billboardCode: string | null;
  reference: string | null;
  address: string | null;
  departmentId: number | null;
  departmentName: string | null;
  cityName: string | null;
  streetName: string | null;
  height: number | null;
  width: number | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  imageId: number | null;
  imageDate: string | null;
  imageNotes: string | null;
}

export type AvailableBillboardListing = Omit<
  AvailableBillboard,
  "imageId" | "imageDate" | "imageNotes"
>;

export interface AvailableBillboardReport extends AvailableBillboard {
  impressionPrice: number | null;
}
