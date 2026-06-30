export interface AuthUserDetail {
  email: string;
  name: string;
  logoUrl?: string | null;
  userId: number;
  roles: string[];
}

export interface OrganizerProfileSummary {
  name: string;
  uniqueId: string;
}

export interface OrganizerPaymentAccountSummary {
  name: string;
  uniqueId: string;
  stripeAccountNo?: string | null;
  stripePublishableKey?: string | null;
}

export interface OrganizerDetail {
  email: string;
  name: string;
  organizerId: number;
  organizerUniqueId: string;
  emailBrandingEnabled: boolean;
  profiles: OrganizerProfileSummary[];
  paymentAccounts: OrganizerPaymentAccountSummary[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresOnUtc: string;
  expiresInMinutes: number;
  userDetail: AuthUserDetail;
  organizerDetail: OrganizerDetail;
}

export interface LoginChallenge {
  requiresTwoFactor: true;
  twoFaToken: string;
}

