export interface MembershipBannerStepState {
  bannerUrl: string;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
}
