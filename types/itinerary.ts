export interface ItineraryImage {
  id: string;
  itineraryId: string;
  imageUrl: string;
  imageKitFileId: string;
  caption?: string;
  displayOrder: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
