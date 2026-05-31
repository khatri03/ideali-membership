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
  reload: () => void;
  unsplashQuery: string;
  unsplashResults: UnsplashPhoto[];
  unsplashTotalResults: number;
  isSearchingUnsplash: boolean;
  isLoadingMoreUnsplash: boolean;
  hasMoreUnsplashResults: boolean;
  unsplashSearchError: string;
  selectedUnsplashPhoto: UnsplashPhoto | null;
  setUnsplashQuery: (value: string) => void;
  searchUnsplash: (
    queryOverride?: string,
    options?: {
      suppressNextDebounce?: boolean;
    },
  ) => Promise<void>;
  loadMoreUnsplash: () => void;
  selectUnsplashPhoto: (photo: UnsplashPhoto) => void;
}
