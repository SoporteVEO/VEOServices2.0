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
  imageDate: Date | null;
  imageNotes: string | null;
  monthsWithoutPurchase: number | null;
  availableDiscount: number | null;
  totalPrice: number | null;
  isAvailable: boolean;
}

/** Same as {@link AvailableBillboard} without image fields (listing / dashboard). */
export type AvailableBillboardListing = Omit<
  AvailableBillboard,
  'imageId' | 'imageDate' | 'imageNotes'
>;

/** Extended billboard data used for report generation (includes impression price). */
export interface AvailableBillboardReport extends AvailableBillboard {
  impressionPrice: number | null;
}

export interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

export interface AvailableDigitalBillboard {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  maxSpots: number;
  spotsUsed: number;
  spotsRemaining: number;
  imageUrl: string | null;
  departmentId: number | null;
  departmentName: string | null;
}
