import type { FormEvent } from "react";

export type MembershipTheme = {
  accentRgb: { r: number; g: number; b: number };
  level1: string;
  level2: string;
  level3: string;
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  labelColor: string;
  mutedLabelColor: string;
  tileBorder: string;
  tileBackground: string;
  tileLabelColor: string;
  tileValueColor: string;
  barBackground: string;
};
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationSubmitContext,
  DiscountCouponValidationResult,
} from "../../types/membershipRegistration";

export interface MembershipRegisterPageViewModel {
  info: MembershipRegistrationInfo | null;
  form: MembershipRegistrationFormState;
  isLoading: boolean;
  loadError: string;
  registrationState: MembershipRegistrationInfo["registrationState"];
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  submitError: string;
  submitMessage: string;
  isSubmitting: boolean;
  isRegistrationUnavailable: boolean;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  couponValidation: DiscountCouponValidationResult | null;
  couponValidationError: string;
  isValidatingCoupon: boolean;
  isCouponApplied: boolean;
  onValidateCoupon: () => Promise<void>;
  onClearCoupon: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    context: MembershipRegistrationSubmitContext,
  ) => Promise<void>;
  onRetry: () => void;
  setField: <T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => void;
}
