import type { UnsplashOrientation } from "../../../lib/unsplash";
export type { UnsplashOrientation };

export type BannerSourceMode = "upload" | "unsplash";

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

export interface MembershipBannerStepState {
  bannerUrl: string;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  bannerSource: BannerSourceMode;
  isUploadingBanner: boolean;
  reload: () => void;
  unsplashQuery: string;
  unsplashResults: UnsplashPhoto[];
  unsplashTotalResults: number;
  isSearchingUnsplash: boolean;
  isLoadingMoreUnsplash: boolean;
  hasMoreUnsplashResults: boolean;
  unsplashSearchError: string;
  bannerUploadError: string;
  selectedUnsplashPhoto: UnsplashPhoto | null;
  unsplashOrientation: UnsplashOrientation;
  setBannerSource: (value: BannerSourceMode) => void;
  setUnsplashQuery: (value: string) => void;
  setUnsplashOrientation: (value: UnsplashOrientation) => void;
  searchUnsplash: (
    queryOverride?: string,
    orientationOverride?: UnsplashOrientation,
    options?: {
      suppressNextDebounce?: boolean;
    },
  ) => Promise<void>;
  uploadBannerImage: (file: File) => Promise<void>;
  loadMoreUnsplash: () => void;
  selectUnsplashPhoto: (photo: UnsplashPhoto) => void;
}
