import { apiRequest } from "@/lib/apiClient";

export interface CreateReviewDto {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function createReview(dto: CreateReviewDto): Promise<Review> {
  return apiRequest<Review>("/reviews", { method: "POST", body: dto });
}
