export type PollAudienceType = "Public" | "MembersOnly";

export type PollStatus = "Draft" | "Published" | "Closed" | "Archived";

export type PollQuestionType =
  | "SingleChoice"
  | "MultipleChoice"
  | "StarRating"
  | "Nps"
  | "YesNo"
  | "RankedChoice"
  | "OpenText"
  | "Matrix";

export type PollListSortBy =
  | "title"
  | "audienceType"
  | "status"
  | "questionCount"
  | "voteCount";

export type PollVoteIdentityType = "Authenticated" | "Anonymous";

export interface OrganizerPollSummary {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  allowOneVotePerPerson: boolean;
  requiredMembershipTypeUniqueIds: string[];
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questionCount: number;
  voteCount: number;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface OrganizerPollOption {
  uniqueId: string;
  label: string;
  value: string | null;
  displayOrder: number;
}

export interface OrganizerPollMatrixRow {
  uniqueId: string;
  label: string;
  displayOrder: number;
}

export interface OrganizerPollMatrixColumn {
  uniqueId: string;
  label: string;
  value: string | null;
  displayOrder: number;
}

export interface OrganizerPollQuestion {
  uniqueId: string;
  questionType: PollQuestionType;
  text: string;
  displayOrder: number;
  isRequired: boolean;
  options: OrganizerPollOption[];
  matrixRows: OrganizerPollMatrixRow[];
  matrixColumns: OrganizerPollMatrixColumn[];
}

export interface OrganizerPollDetail {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  allowOneVotePerPerson: boolean;
  requiredMembershipTypeUniqueIds: string[];
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questions: OrganizerPollQuestion[];
  createdAtUtc: string;
  updatedAtUtc: string | null;
  currentUserVote: OrganizerPollVote | null;
}

export interface OrganizerPollQuestionDraft {
  uniqueId: string;
  questionType: PollQuestionType;
  text: string;
  displayOrder: number;
  isRequired: boolean;
  options: OrganizerPollOption[];
  matrixRows: OrganizerPollMatrixRow[];
  matrixColumns: OrganizerPollMatrixColumn[];
}

export interface OrganizerPollDraft {
  uniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  allowOneVotePerPerson: boolean;
  requiredMembershipTypeUniqueIds: string[];
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questions: OrganizerPollQuestionDraft[];
}

export interface OrganizerPollVoteAnswer {
  questionUniqueId: string;
  optionUniqueIds: string[];
  textValue: string | null;
  numericValue: number | null;
  rankValue: number | null;
  matrixSelections: OrganizerPollVoteMatrixSelection[];
}

export interface OrganizerPollVoteMatrixSelection {
  rowUniqueId: string;
  columnUniqueId: string;
}

export interface OrganizerPollVoteIdentity {
  voteIdentityType: PollVoteIdentityType;
  userUniqueId: string | null;
  anonymousVoteKeyHash: string | null;
}

export interface OrganizerPollVote {
  uniqueId: string;
  pollUniqueId: string;
  votedAtUtc: string;
  voteIdentity: OrganizerPollVoteIdentity;
  answers: OrganizerPollVoteAnswer[];
}

export interface OrganizerPollReviewSummary {
  pollUniqueId: string;
  totalResponses: number;
  authenticatedResponses: number;
  anonymousResponses: number;
  questionCount: number;
  requiredQuestionCount: number;
  optionalQuestionCount: number;
  firstSubmittedAtUtc: string | null;
  lastSubmittedAtUtc: string | null;
  participationChart: OrganizerPollParticipationChart;
  questions: OrganizerPollQuestionReviewSummary[];
}

export interface OrganizerPollParticipationChart {
  totalResponses: number;
  publicResponses: number;
  publicResponsesPercentage: number;
  slices: OrganizerPollParticipationSlice[];
}

export interface OrganizerPollParticipationSlice {
  key: string;
  label: string;
  membershipTypeUniqueId: string | null;
  count: number;
  percentage: number;
  color: string;
  isPublic: boolean;
}

export interface OrganizerPollQuestionReviewSummary {
  questionUniqueId: string;
  text: string;
  questionType: PollQuestionType;
  displayOrder: number;
  isRequired: boolean;
  responseCount: number;
  totalSelections: number;
  completionRatePercentage: number;
  averageNumericValue: number | null;
  minimumNumericValue: number | null;
  maximumNumericValue: number | null;
  averageRankValue: number | null;
  firstPlaceVotes: number;
  npsPromoterCount: number;
  npsPassiveCount: number;
  npsDetractorCount: number;
  npsScore: number | null;
  starRatingSummaries: OrganizerPollReviewRatingSummary[];
  optionSummaries: OrganizerPollReviewOptionSummary[];
  matrixCellSummaries: OrganizerPollReviewMatrixCellSummary[];
  textSamples: OrganizerPollReviewTextSample[];
}

export interface OrganizerPollReviewRatingSummary {
  ratingValue: number;
  label: string;
  count: number;
  percentage: number;
}

export interface OrganizerPollReviewOptionSummary {
  optionUniqueId: string | null;
  label: string;
  count: number;
  percentage: number;
  averageRankValue: number | null;
  firstPlaceVotes: number;
}

export interface OrganizerPollReviewMatrixCellSummary {
  rowUniqueId: string;
  rowLabel: string;
  columnUniqueId: string;
  columnLabel: string;
  count: number;
  percentage: number;
}

export interface OrganizerPollReviewTextSample {
  value: string;
  submittedAtUtc: string;
}
