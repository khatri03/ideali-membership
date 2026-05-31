import { getJson } from "./api";

export interface UnsplashPhoto {
  id: string;
  description: string;
  altDescription: string;
  imageUrl: string;
  photographerName: string;
  photographerProfileUrl: string;
  photoPageUrl: string;
  width: number;
  height: number;
}

interface UnsplashSearchApiPhotoDto {
  id: string;
  description: string;
  altDescription: string;
  imageUrl: string;
  photographerName: string;
  photographerProfileUrl: string;
  photoPageUrl: string;
  width: number;
  height: number;
}

interface UnsplashSearchApiResponseDto {
  query: string;
  totalResults: number;
  results: UnsplashSearchApiPhotoDto[];
}

interface UnsplashServiceResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UnsplashSearchResult {
  query: string;
  totalResults: number;
  results: UnsplashPhoto[];
}

export type UnsplashOrientation = "landscape" | "portrait" | "squarish" | "any";

function toPhoto(photo: UnsplashSearchApiPhotoDto): UnsplashPhoto {
  return {
    id: photo.id,
    description: photo.description,
    altDescription: photo.altDescription,
    imageUrl: photo.imageUrl,
    photographerName: photo.photographerName,
    photographerProfileUrl: photo.photographerProfileUrl,
    photoPageUrl: photo.photoPageUrl,
    width: photo.width,
    height: photo.height,
  };
}

export async function searchUnsplashPhotos(
  query: string,
  options?: {
    page?: number;
    perPage?: number;
    orientation?: UnsplashOrientation;
    signal?: AbortSignal;
  },
): Promise<UnsplashSearchResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      totalResults: 0,
      results: [],
    };
  }

  const page = Math.max(options?.page ?? 1, 1);
  const perPage = Math.min(Math.max(options?.perPage ?? 12, 1), 30);
  const orientation = options?.orientation ?? "landscape";
  const orientationQuery =
    orientation === "any" ? "" : `&orientation=${encodeURIComponent(orientation)}`;
  const payload = await getJson<UnsplashServiceResponse<UnsplashSearchApiResponseDto>>(
    `/api/unsplash/search?query=${encodeURIComponent(normalizedQuery)}&page=${page}&perPage=${perPage}${orientationQuery}`,
    { signal: options?.signal },
  );

  if (!payload.success) {
    throw new Error(payload.message || "Unable to search Unsplash.");
  }

  return {
    query: payload.data?.query ?? normalizedQuery,
    totalResults: payload.data?.totalResults ?? 0,
    results: (payload.data?.results ?? []).map(toPhoto),
  };
}
