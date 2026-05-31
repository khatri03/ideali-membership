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
  isEditingBanner: boolean;
  bannerEditError: string;
  selectedUnsplashPhoto: UnsplashPhoto | null;
  unsplashOrientation: UnsplashOrientation;
  setBannerSource: (value: BannerSourceMode) => void;
  clearBannerSelection: () => void;
  setUnsplashQuery: (value: string) => void;
  setUnsplashOrientation: (value: UnsplashOrientation) => void;
  openBannerEditor: () => void;
  closeBannerEditor: () => void;
  searchUnsplash: (
    queryOverride?: string,
    orientationOverride?: UnsplashOrientation,
    options?: {
      suppressNextDebounce?: boolean;
    },
  ) => Promise<void>;
  completeBannerEdit: (payload: {
    canvas: HTMLCanvasElement;
    imageMime: string;
    imageName: string;
  }) => Promise<void>;
  uploadBannerImage: (file: File) => Promise<void>;
  loadMoreUnsplash: () => void;
  selectUnsplashPhoto: (photo: UnsplashPhoto) => void;
}
